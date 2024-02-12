import { Column, ColumnId } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

import { moveColumns, setColumnsStyleProps } from './utils';
import { GridStore } from './store';

export const setColumn = (id: ColumnId, column: Column) => (state: GridStore) => {
  const { columnDefs } = state;
  columnDefs[id] = column;

  return { columnDefs };
}

export const hideColumn = (id: ColumnId) => (state: GridStore) => {
  const { columnDefs, container, columns } = state;
  const column = columnDefs[id];
  column.hidden = !column.hidden;

  setColumnsStyleProps(columnDefs, container.offsetWidth);
  moveColumns(columnDefs, columns);

  return { columnDefs };
};

export const swapColumns = (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
  const { columnDefs } = state;
  const column1 = columnDefs[id1];
  const column2 = columnDefs[id2];

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

  return { columnDefs };
};

export const resizeColumn = (id: ColumnId, width: number) => (state: GridStore) => {
  const { columnDefs, columns } = state;
  const column = columnDefs[id];
  
  column.width = Math.max(width, column.minWidth || MIN_COL_WIDTH);
  column.flex = undefined

  moveColumns(columnDefs, columns, column.position);

  return { columnDefs };
}
