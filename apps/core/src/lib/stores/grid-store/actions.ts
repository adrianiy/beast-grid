/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Column, ColumnId, IFilter } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

import { addSort, moveColumns, removeSort, setColumnsStyleProps } from './utils';
import { GridStore } from './store';
import { FilterType, SortType } from '../../common';

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
  const { columns, container } = state;
  const column = columns[id];
  column.hidden = !column.hidden;

  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns);

  return { columns };
};

export const swapColumns = (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
  const { columns } = state;
  const column1 = columns[id1];
  const column2 = columns[id2];

  if (!column1 || !column2) {
    return state;
  }

  // change positions
  const temp = column1.position;
  column1.position = column2.position;
  column2.position = temp;

  if (column1.left < column2.left) {
    column2.left = column1.left;
    column1.left = column1.left + column2.width;
  } else {
    column1.left = column2.left;
    column2.left = column2.left + column1.width;
  }

  moveColumns(columns);

  return { ...columns };
};

export const resizeColumn = (id: ColumnId, width: number) => (state: GridStore) => {
  const { columns } = state;
  const column = columns[id];

  column.width = Math.max(width, column.minWidth || MIN_COL_WIDTH);
  column.flex = undefined;

  moveColumns(columns, column.position);

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
  } else if (column.sort?.order === SortType.ASC || sortType) {
    column.sort.order = sortType || SortType.DESC;
  } else {
    removeSort(column, sortedColumns);

    columnsWithSort = columnsWithSort.filter((col) => col.id !== id);
  }

  return { columns, sort: columnsWithSort.map((col) => col.id) };
};

export const addFilter = (id: ColumnId, value: IFilter) => (state: GridStore) => {
  const { columns, filters } = state;
  const column = columns[id];

  if (column.filterType === FilterType.STRING) {
    if (filters[id]?.includes(value as string)) {
      filters[id] = filters[id]?.filter((val) => val !== value);
    } else {
      filters[id] = filters[id] ? [...filters[id], value as string] : [value as string];
    }
  }

  return { columns, filters: {...filters} };
};

export const selectAllFilters = (id: ColumnId) => (state: GridStore) => {
  const { columns, filters } = state;
  const column = columns[id];
  
  if (column.filterOptions?.length === filters[id]?.length) {
    filters[id] = [];
  } else {
    filters[id] = column.filterOptions as string[];
  }
  
  return { columns, filters: {...filters} };
}

