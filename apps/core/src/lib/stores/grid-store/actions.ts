/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Column, ColumnId, IFilter } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

import {
  addSort,
  getSwappableClone,
  mergeColumns,
  moveColumns,
  removeSort,
  setColumnsStyleProps,
  sortColumns,
  swapPositions,
} from './utils';
import { GridStore } from './store';
import { PinType, SortType } from '../../common';

export const setColumn = (id: ColumnId, column: Column) => (state: GridStore) => {
  const { columns } = state;
  columns[id] = column;

  return { columns };
};

export const resetColumnConfig = (id: ColumnId) => (state: GridStore) => {
  const { columns } = state;
  const column = columns[id];
  column.sort = undefined;

  const columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

  return { columns, sort: columnsWithSort.map((col) => col.id) };
};

export const hideColumn = (id: ColumnId) => (state: GridStore) => {
  const { columns, sortedColumns, container } = state;
  const column = columns[id];
  column.hidden = !column.hidden;

  if (column.childrenId) {
    column.childrenId.forEach((child) => {
      columns[child].hidden = column.hidden;
    });
  }
  if (column.parent) {
    const parent = columns[column.parent];
    const allChildrenHidden = parent.childrenId?.every((child) => columns[child].hidden);
    parent.hidden = allChildrenHidden;
  }

  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns, sortedColumns, column.pinned);

  return { columns };
};

export const swapColumns = (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
  const { columns } = state;
  let { sortedColumns } = state;
  let column1 = columns[id1];
  let column2 = columns[id2];
  let left = 0;

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

  return { columns, sortedColumns };
};

export const deleteEmptyParents = () => (state: GridStore) => {
  const { columns } = state;

  Object.values(columns).forEach((column) => {
    if (column.logicDelete) {
      delete columns[column.id];
    }
  });

  return { columns };
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

  const left = moveColumns(columns, sortedColumns, PinType.LEFT);
  moveColumns(columns, sortedColumns, PinType.NONE, left);

  return { columns };
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

  return { columns, sort: columnsWithSort.map((col) => col.id) };
};

export const addFilter = (id: ColumnId, value: IFilter) => (state: GridStore) => {
  const { columns, filters } = state;

  if (filters[id]?.includes(value as string)) {
    filters[id] = filters[id]?.filter((val) => val !== value);
  } else {
    filters[id] = filters[id] ? [...filters[id], value as string] : [value as string];
  }

  return { columns, filters: { ...filters } };
};

export const selectAllFilters = (id: ColumnId) => (state: GridStore) => {
  const { columns, filters } = state;
  const column = columns[id];

  if (column.filterOptions?.length === filters[id]?.length) {
    filters[id] = [];
  } else {
    filters[id] = column.filterOptions as string[];
  }

  return { columns, filters: { ...filters } };
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

  moveColumns(columns, sortedColumns, PinType.LEFT)
  moveColumns(columns, sortedColumns, PinType.NONE, 0)
  moveColumns(columns, sortedColumns, PinType.RIGHT, 0)

  return { columns };
}
