import { v4 as uuidv4 } from 'uuid';
import { ColumnStore, Column } from "../../../common";

const _changeCloneStyles = (column: Column, parent: Column, destiny: Column, columns: ColumnStore) => {
  parent.width = parent.childrenId?.reduce((acc, child) => acc + columns[child].width, 0) || 0;
  destiny.width = column.width;
};
const _getParentClone = (column: Column, columns: ColumnStore): Column => {
  if (!column.parent) {
    return column;
  }
  const id = uuidv4();
  const parent = columns[column.parent];
  const parentClone = { ...parent, id, original: column.parent, childrenId: [column.id] };
  column.originalParent = parent.id;
  column.parent = id;
  column.position = 0;
  parent.childrenId = parent.childrenId?.filter((child) => child !== column.id);
  _changeCloneStyles(column, parent, parentClone, columns);

  return _getParentClone(parentClone, columns);
};

const _changePosition = (pivot: Column, columns: ColumnStore) => {
  Object.values(columns).forEach((column) => {
    if (column.position >= pivot.position && column.level === pivot.level && column.id !== pivot.id) {
      column.position++;
    }
  });
};

const _cloneColumn = (column: Column, columns: ColumnStore): Column => {
  const parentClone = _getParentClone(column, columns);

  columns[parentClone.id] = parentClone;

  return parentClone;
};

const _getParent = (column: Column, columns: ColumnStore): Column | undefined => {
  if (!column.parent) {
    return column;
  }

  return _getParent(columns[column.parent], columns);
};

export const getSwappableClone = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
  let swappable1 = column1.originalParent ? _getParent(column1, columns) : column1.parent ? undefined : column1;
  let swappable2 = column2.originalParent ? _getParent(column2, columns) : column2.parent ? undefined : column2;

  if (!swappable1 || !swappable2) {
    if (!swappable1) {
      swappable1 = _cloneColumn(column1, columns);
    }
    if (!swappable2) {
      swappable2 = _cloneColumn(column2, columns);
    }
    const ltr = swappable1.left < swappable2.left;

    if (ltr) {
      _changePosition(columns[swappable1.original || swappable1.id], columns);
      _changePosition(swappable2, columns);
    } else {
      _changePosition(columns[swappable2.original || swappable2.id], columns);
      _changePosition(swappable1, columns);
    }
  }

  return [swappable1, swappable2];
};


export const swapPositions = (column1: Column, column2: Column) => {
  // change positions
  const position = column2.position;
  const left = column2.left;
  column2.position = column1.position;
  column2.left = column1.left;
  column1.position = position;
  column1.left = left;
};
