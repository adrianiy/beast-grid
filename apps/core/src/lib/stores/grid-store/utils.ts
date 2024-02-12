
import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnArray, ColumnDef, ColumnStore } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';

export const getColumnsFromDefs = (
  columnDefs: ColumnDef[],
  defaultColumnDef?: ColumnDef,
  level = 0,
  parent?: string
): ColumnStore => {
  // If no columnDefs, return empty object
  if (columnDefs.length === 0) {
    return {};
  }

  const columns: ColumnStore = {};

  // Loop through columnDefs
  // Create column object
  // If column has children, call getColumnsFromDefs recursively
  columnDefs.forEach((columnDef, idx) => {
    const id = uuidv4();
    const column: Column = {
      ...(defaultColumnDef || {}),
      ...columnDef,
      position: idx,
      width: columnDef.width || columnDef.minWidth || MIN_COL_WIDTH,
      top: 0,
      left: 0,
      final: !columnDef.children || columnDef.children.length === 0,
      id,
      parent,
      level,
    };

    columns[id] = column;

    if (columnDef.children) {
      const childrenColumns = getColumnsFromDefs(columnDef.children, defaultColumnDef, level + 1, id);

      Object.assign(columns, childrenColumns);
    }
  });

  // Return columns and accumulator
  return columns;
};

export const getColumnArrayFromDefs = (columnStore: ColumnStore): Column[][] => {
  const columns = Object.values(columnStore).reduce((acc, column) => {
    if (!acc[column.level]) {
      acc[column.level] = [];
    }
    acc[column.level].push(column);
    return acc;
  }, [] as Column[][]);

  return columns
}

export const initialize = (columnDefs: ColumnStore, columns: ColumnArray, container: HTMLDivElement) => {
  setColumnsStyleProps(columnDefs, container.offsetWidth);
  moveColumns(columnDefs, columns);
}

export const setColumnsStyleProps = (columnStore: ColumnStore, containeWidth: number): ColumnStore => {
  const finalColumns = Object.values(columnStore).filter((column) => column.final && !column.hidden);
  const dynamicColumns = finalColumns.filter((column) => !column.width || column.flex);
  const totalFlex = dynamicColumns.reduce((acc, column) => acc + (column.flex ?? 0), 0);

  // Calculate width for user defined columns
  const fixedWidth = finalColumns.reduce(
    (acc, column) => acc + (!column.flex ? column.width || MIN_COL_WIDTH : 0),
    0
  );

  // Calculate width remaining for non forced width columns
  const remainingWidth = containeWidth - fixedWidth;

  // Set width for flex columns
  dynamicColumns.forEach((column) => {
    const flexWidth = ((column.flex ?? 0) / totalFlex) * remainingWidth;
    columnStore[column.id].width = Math.max(flexWidth, column.minWidth || MIN_COL_WIDTH);
  });

  return columnStore;
};


export const moveColumns = (columnStore: ColumnStore, columns: ColumnArray, statingPosition = 0) => {
  let left = 0;
    
  columns.forEach((level) => {
    const sortedColumns = [...level].sort((a, b) => a.position - b.position);

    sortedColumns.forEach((column) => {
      if (columnStore[column.id].hidden) {
        return;
      }
      if (columnStore[column.id].position <= statingPosition) {
        left += columnStore[column.id].width || 150;
        return;
      }
      columnStore[column.id].left = left;
      left += columnStore[column.id].width || 150;
    });
  });
};

export const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: unknown, ...args: unknown[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
