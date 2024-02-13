/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import { v4 as uuidv4 } from 'uuid';
import {
  Column,
  ColumnArray,
  ColumnDef,
  ColumnStore,
} from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';
import { SortType } from '../../common';

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
      const childrenColumns = getColumnsFromDefs(
        columnDef.children,
        defaultColumnDef,
        level + 1,
        id
      );

      Object.assign(columns, childrenColumns);
    }
  });

  // Return columns and accumulator
  return columns;
};

export const getColumnArrayFromDefs = (
  columnStore: ColumnStore
): Column[][] => {
  const columns = Object.values(columnStore).reduce((acc, column) => {
    if (!acc[column.level]) {
      acc[column.level] = [];
    }
    acc[column.level].push(column);
    return acc;
  }, [] as Column[][]);

  return columns;
};

export const initialize = (columns: ColumnStore, container: HTMLDivElement) => {
  setColumnsStyleProps(columns, container.offsetWidth);
  moveColumns(columns);
};

export const setColumnsStyleProps = (
  columnStore: ColumnStore,
  containeWidth: number
): ColumnStore => {
  const finalColumns = Object.values(columnStore).filter(
    (column) => column.final && !column.hidden
  );
  const dynamicColumns = finalColumns.filter(
    (column) => !column.width || column.flex
  );
  const totalFlex = dynamicColumns.reduce(
    (acc, column) => acc + (column.flex ?? 0),
    0
  );

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
    columnStore[column.id].width = Math.max(
      flexWidth,
      column.minWidth || MIN_COL_WIDTH
    );
  });

  return columnStore;
};

export const moveColumns = (columns: ColumnStore, statingPosition = 0) => {
  let left = 0;

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  levels.forEach((level) => {
    const sortedColumns = [...level].sort((a, b) => a.position - b.position);

    sortedColumns.forEach((column) => {
      if (columns[column.id].hidden) {
        return;
      }
      if (columns[column.id].position <= statingPosition) {
        left += columns[column.id].width || 150;
        return;
      }
      columns[column.id].left = left;
      left += columns[column.id].width || 150;
    });
  });
};

export const addSort = (
  column: Column,
  columnsWithSort: Column[],
  multipleColumnSort: boolean
) => {
  if (multipleColumnSort) {
    const lastPriority = columnsWithSort.reduce(
      (acc, col) => Math.max(acc, col.sort!.priority),
      0
    );

    column.sort = {
      order: SortType.ASC,
      priority: lastPriority + 1,
    };
  } else {
    column.sort = {
      order: SortType.ASC,
      priority: 1,
    };

    delete columnsWithSort[0].sort;
  }
};

export const removeSort = (column: Column, columnsWithSort: Column[]) => {
  columnsWithSort.forEach((col) => {
    if (col.sort!.priority > column.sort!.priority) {
      col.sort!.priority -= 1;
    }
  });
  delete column.sort;
};

export const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function (this: unknown, ...args: unknown[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
