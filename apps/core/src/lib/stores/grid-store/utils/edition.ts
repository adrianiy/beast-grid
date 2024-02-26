import { ColumnStore, Column, SortType } from '../../../common';

const _updateParent = (column: Column, parent: Column, columns: ColumnStore) => {
  parent.childrenId?.forEach((id, idx) => {
    columns[id].position = idx;
    columns[id].parent = parent.id;
    columns[id].originalParent = undefined;
  });
  parent.width += column.width;
};
const _mergeIn = (parent: Column, column: Column, columns: ColumnStore) => {
  parent.childrenId?.push(...column.childrenId || []);
  _updateParent(column, parent, columns);
};
const _mergeTo = (parent: Column, column: Column, columns: ColumnStore) => {
  parent.childrenId = [...column.childrenId || [], ...(parent.childrenId || [])];
  _updateParent(column, parent, columns);
};

export const mergeColumns = (columns: ColumnStore) => {
  const sortedColumns = Object.values(columns).sort(
    (a, b) =>
      a.level - b.level ||
      columns[a.parent as string]?.position - columns[b.parent as string]?.position ||
      a.position - b.position
  ).filter((column) => (column.final && !column.parent) || column.childrenId);
  let lastColumn: Column = sortedColumns[0];

  for (const column of sortedColumns) {
    if (lastColumn.id === column.original) {
      _mergeIn(lastColumn, column, columns);
      delete columns[column.id];
    }
    if (lastColumn.original === column.id) {
      _mergeTo(column, lastColumn, columns);
      delete columns[lastColumn.id]
    }
    if (lastColumn.original && lastColumn.original === column.original) {
      _mergeIn(lastColumn, column, columns);
      delete columns[column.id]
    }
    lastColumn = column;
  }
};

export const moveColumns = (columns: ColumnStore) => {
  const sortedColumns = Object.values(columns).sort(
    (a, b) =>
      a.level - b.level ||
      columns[a.parent as string]?.position - columns[b.parent as string]?.position ||
      a.position - b.position
  );

  let left = 0;
  let lastColumn: Column = sortedColumns[0];

  for (const column of sortedColumns) {
    if (lastColumn.parent !== column.parent) {
      left = 0;
      lastColumn = column;
    }
    if (column.hidden || column.logicDelete) {
      continue;
    }
    columns[column.id].left = left + (columns[column.parent as string]?.left || 0);
    left += columns[column.id].width || 150;
  }
  console.log('move', JSON.parse(JSON.stringify(sortedColumns)));
};

export const addSort = (
  column: Column,
  columnsWithSort: Column[],
  multipleColumnSort: boolean,
  order: SortType = SortType.ASC
) => {
  if (multipleColumnSort) {
    const lastPriority = columnsWithSort.reduce((acc, col) => Math.max(acc, col.sort?.priority as number), 0);

    column.sort = {
      order,
      priority: lastPriority + 1,
    };
  } else {
    column.sort = {
      order,
      priority: 1,
    };

    if (columnsWithSort.length > 0) {
      delete columnsWithSort[0].sort;
    }
  }
};

export const removeSort = (column: Column, columnsWithSort: Column[]) => {
  columnsWithSort.forEach((col) => {
    if (col.sort && (col.sort?.priority || 0) > (column.sort?.priority || 0)) {
      col.sort.priority -= 1;
    }
  });
  delete column.sort;
};
