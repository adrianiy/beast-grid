/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Column, ColumnId } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

import {
  addSort,
  moveColumns,
  removeSort,
  setColumnsStyleProps,
} from './utils';
import { GridStore } from './store';
import { SortType } from '../../common';

export const setColumn =
  (id: ColumnId, column: Column) => (state: GridStore) => {
    const { columns } = state;
    columns[id] = column;

    return { columns };
  };

export const hideColumn = (id: ColumnId) => (state: GridStore) => {
  const { columns, container } = state;
  const column = columns[id];
  column.hidden = !column.hidden;

  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns);

  return { columns };
};

export const swapColumns =
  (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
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

export const resizeColumn =
  (id: ColumnId, width: number) => (state: GridStore) => {
    const { columns } = state;
    const column = columns[id];

    column.width = Math.max(width, column.minWidth || MIN_COL_WIDTH);
    column.flex = undefined;

    moveColumns(columns, column.position);

    return { columns };
  };

// Changes the sort tye of a column
export const changeSort =
  (id: ColumnId, multipleColumnSort: boolean) => (state: GridStore) => {
    const { columns } = state;

    let columnsWithSort = Object.values(columns).filter(
      (col) => col.sort?.priority
    );

    const sortedColumns = columnsWithSort.sort(
      (a, b) => a.sort!.priority - b.sort!.priority
    );
    const column = columns[id];

    if (!column.sort) {
      addSort(column, sortedColumns, multipleColumnSort);
    } else if (column.sort?.order === SortType.ASC) {
      column.sort.order = SortType.DESC;
    } else {
      removeSort(column, sortedColumns);

      columnsWithSort = columnsWithSort.filter((col) => col.id !== id);
    }

    return { columns, sort: columnsWithSort.map((col) => col.id) };
  };
