/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Column, ColumnId, IFilter } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

import {
  addSort,
  changePosition,
  getSwappableClone,
  groupDataByColumnDefs,
  mergeColumns,
  moveColumns,
  removeSort,
  setColumnsStyleProps,
  sortColumns,
  swapPositions,
  toggleHide,
} from './utils';
import { GridStore } from './store';
import { Coords, FilterType, PinType, SelectedCells, SortType } from '../../common';
import { createGroupColumn } from './utils/group';
import { clone } from '../../utils/functions';

export const setColumn = (id: ColumnId, column: Column) => (state: GridStore) => {
  const { columns } = state;
  columns[id] = column;

  return { columns, edited: true };
};

export const resetColumnConfig = (id: ColumnId) => (state: GridStore) => {
  const { columns } = state;
  const column = columns[id];
  column.sort = undefined;

  const columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

  return { columns, sort: columnsWithSort.map((col) => col.id), edited: true };
};

export const hideColumn = (id: ColumnId) => (state: GridStore) => {
  const { columns, sortedColumns, container } = state;
  const column = columns[id];

  toggleHide(column, columns);

  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns, sortedColumns, column.pinned);

  return { columns, edited: true };
};

export const swapColumns = (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
  const { columns } = state;
  let { sortedColumns } = state;
  let column1 = columns[id1];
  let column2 = columns[id2];

  if (!column1 || !column2) {
    return state;
  }

  if (column1.parent !== column2.parent) {
    [column1, column2] = getSwappableClone(column1, column2, columns);
  }

  // change positions
  swapPositions(column1, column2);
  mergeColumns(columns);

  sortedColumns = sortColumns(columns);

  moveColumns(columns, sortedColumns, column1.pinned, 0);

  return { columns, sortedColumns, edited: true };
};

export const deleteEmptyParents = () => (state: GridStore) => {
  const { columns } = state;

  Object.values(columns).forEach((column) => {
    if (column.logicDelete) {
      delete columns[column.id];
    }
  });

  return { columns, edited: true };
};

export const resizeColumn = (id: ColumnId, width: number) => (state: GridStore) => {
  const { columns, sortedColumns } = state;
  const column = columns[id];

  const prevWidth = column.width;

  column.width = Math.max(width, column.minWidth || MIN_COL_WIDTH);
  column.flex = undefined;

  if (column.parent) {
    const diff = column.width - prevWidth;
    columns[column.parent].width += diff;
  }
  if (column.children) {
    const diff = (column.width - prevWidth) / column.children.length;
    column.childrenId?.forEach((child) => {
      columns[child].width = (columns[child].width || 0) + diff;
    });
  }

  moveColumns(columns, sortedColumns, PinType.LEFT);
  moveColumns(columns, sortedColumns, PinType.NONE);

  return { columns, edited: true };
};

// Changes the sort tye of a column
export const changeSort = (id: ColumnId, multipleColumnSort: boolean, sortType?: SortType) => (state: GridStore) => {
  const { columns } = state;

  let columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

  const sortedColumns = columnsWithSort.sort((a, b) => a.sort!.priority - b.sort!.priority);
  const column = columns[id];

  if (!column.sort) {
    addSort(column, sortedColumns, multipleColumnSort, sortType);
  } else if (sortType === column.sort?.order) {
    removeSort(column, sortedColumns);
  } else if (column.sort?.order === SortType.ASC || sortType) {
    column.sort.order = sortType || SortType.DESC;
  } else {
    removeSort(column, sortedColumns);
  }

  columnsWithSort = columnsWithSort.filter((col) => col.id !== id);

  return { columns, sort: columnsWithSort.map((col) => col.id), edited: true };
};

export const addFilter = (id: ColumnId, value: IFilter | null, idx = 0) => (state: GridStore) => {
  const { columns, filters } = state;
  const column = columns[id];

  if (column.filterType === FilterType.TEXT) {
    if (filters[id]?.includes(value as string)) {
      filters[id] = filters[id]?.filter((val) => val !== value);
    } else {
      filters[id] = filters[id] ? [...filters[id], value as string] : [value as string];
    }
  }
  if (column.filterType === FilterType.NUMBER) {
    if (!filters[id]) {
      filters[id] = [];
    }
    if (!value) {
      if (!idx) {
        filters[id] = [];
      } else {
        filters[id] = filters[id]?.filter((_, i) => i !== idx);
      }
    } else if (filters[id][idx]) {
      filters[id][idx] = value;
    } else {
      filters[id][idx] = value;
    }
  }
  if (!filters[id].length) {
    delete filters[id];
  }

  return { columns, filters: { ...filters }, edited: true };
};

export const selectAllFilters = (id: ColumnId) => (state: GridStore) => {
  const { columns, filters } = state;
  const column = columns[id];

  if (column.filterOptions?.length === filters[id]?.length) {
    filters[id] = [];
  } else {
    filters[id] = column.filterOptions as string[];
  }

  return { columns, filters: { ...filters }, edited: true };
};

export const pinColumn = (id: ColumnId, pin: PinType) => (state: GridStore) => {
  const { columns, sortedColumns } = state;
  const column = columns[id];

  column.pinned = pin;

  if (column.childrenId) {
    column.childrenId.forEach((child) => {
      columns[child].pinned = pin;
    });
  }

  moveColumns(columns, sortedColumns, PinType.LEFT);
  moveColumns(columns, sortedColumns, PinType.NONE, 0);
  moveColumns(columns, sortedColumns, PinType.RIGHT, 0);

  return { columns, edited: true };
};

export const groupByColumn = (id: ColumnId) => (state: GridStore) => {
  const { columns, tree, container, groupOrder, initialData } = state;
  const aggColumns = Object.values(columns).filter((col) => col.aggregation);
  const column = columns[id];

  const newColumn = createGroupColumn(column, columns, tree);

  if (tree && !tree.showOriginal) {
    toggleHide(column, columns);
    setColumnsStyleProps(columns, container.offsetWidth);
  }

  newColumn.rowGroup = true;
  groupOrder.push(id);

  const data = groupDataByColumnDefs(columns, aggColumns, initialData, groupOrder);

  const sortedColumns = sortColumns(columns);

  moveColumns(columns, sortedColumns, PinType.LEFT, 0);
  moveColumns(columns, sortedColumns, PinType.NONE, 0);
  moveColumns(columns, sortedColumns, PinType.RIGHT, 0);

  return { columns, groupOrder, data, sortedColumns, edited: true };
};

export const unGroupColumn = (id: ColumnId) => (state: GridStore) => {
  const { columns, container, initialData } = state;
  let { groupOrder } = state;
  const aggColumns = Object.values(columns).filter((col) => col.aggregation);
  const column = columns[id];

  column.rowGroup = false;

  if (column.tree) {
    groupOrder.forEach((col) => {
      toggleHide(columns[col], columns);
      changePosition(columns, column, [column.id], -1);
    });
    groupOrder = [];
    setColumnsStyleProps(columns, container.offsetWidth);
    delete columns[column.id];
  } else {
    groupOrder = groupOrder.filter((col) => col !== id);
  }

  const data = groupDataByColumnDefs(columns, aggColumns, initialData, groupOrder);

  const sortedColumns = sortColumns(columns);

  moveColumns(columns, sortedColumns, PinType.LEFT, 0);
  moveColumns(columns, sortedColumns, PinType.NONE, 0);
  moveColumns(columns, sortedColumns, PinType.RIGHT, 0);

  return { columns, groupOrder, data, sortedColumns, edited: true };
};

export const updateSelectedCells = (selectedCells: SelectedCells | null) => () => {
  return { selectedCells };
}

export const setSelectedStart = (coords: Coords) => () => {
  return { selectedCells: { start: coords, end: coords, init: coords } };
}

export const setSelectedEnd = (coords: Coords) => (state: GridStore) => {
  const { selectedCells } = state;
  
  if (!selectedCells) {
    return state;
  }

  return {
    selectedCells: {
      init: selectedCells.init,
      start: { x: Math.min(selectedCells.init.x, coords.x), y: Math.min(selectedCells.init.y, coords.y) },
      end: { x: Math.max(selectedCells.init.x, coords.x), y: Math.max(selectedCells.init.y, coords.y) },
    },
  };
}

export const restore = () => (state: GridStore) => {
  const { initialColumns, initialData } = state;

  const sortedColumns = sortColumns(initialColumns);

  return { columns: clone(initialColumns), data: clone(initialData), sortedColumns, filters: {}, sort: [], edited: false, groupOrder: [] };
}

export const autoSizeColumns = () => (state: GridStore) => {
  const { columns, container, sortedColumns } = state;

  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns, sortedColumns, PinType.LEFT, 0);
  moveColumns(columns, sortedColumns, PinType.NONE, 0);
  moveColumns(columns, sortedColumns, PinType.RIGHT, 0);

  return { columns };
}

export const setSideBarConfig = (config: unknown) => (state: GridStore) => {
  const { sideBarConfig } = state;

  if (sideBarConfig === config) {
    return { sideBarConfig: null };
  }

  return { sideBarConfig: config };
}

