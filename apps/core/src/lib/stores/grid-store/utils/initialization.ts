import { v4 as uuidv4 } from 'uuid';
import {
  ColumnDef,
  ColumnStore,
  Column,
  Data,
  Row,
  IFilter,
  PinType,
  ColumnId,
  TreeConstructor,
  FilterType,
} from '../../../common';

import { MIN_COL_WIDTH } from './../../../common/globals';
import { groupBy } from '../../../utils/functions';

import deepmerge from 'deepmerge';
import { createGroupColumn } from './group';
import { toggleHide } from './edition';

export const getColumnsFromDefs = (
  columnDefs: ColumnDef[],
  defaultColumnDef?: Partial<ColumnDef>,
  level = 0,
  parent?: Column
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
      ...deepmerge(defaultColumnDef || {}, columnDef),
      width: columnDef.width || 0,
      position: idx,
      finalPosition: idx,
      pinned: parent?.pinned || columnDef.pinned || PinType.NONE,
      top: 0,
      left: 0,
      final: !columnDef.children || columnDef.children.length === 0,
      id,
      parent: parent?.id,
      level,
    };
    columns[id] = column;

    if (columnDef.children) {
      const childrenColumns = getColumnsFromDefs(columnDef.children, defaultColumnDef, level + 1, column);
      column.childrenId = Object.values(childrenColumns).map((c) => c.id);
      column.width = Object.values(childrenColumns).reduce((acc, c) => acc + (c.width || 0), 0);

      Object.assign(columns, childrenColumns);
    }
  });

  // Return columns
  return columns;
};

export const createVirtualIds = (data: Data): Data => {
  const newData = data.map((row, idx) => {
    return {
      ...row,
      _id: uuidv4(),
      _originalIdx: idx,
      children: row.children ? createVirtualIds(row.children) : undefined,
    };
  });

  return [...newData];
};

export const groupDataByColumnDefs = (
  columns: ColumnStore,
  aggColumns: Column[],
  data: Data,
  groupOrder: ColumnId[],
  level = 0
): Data => {
  const aggregationLevel = Object.values(columns).find((c) => groupOrder && c.id === groupOrder[level]);

  if (!aggregationLevel) {
    return data;
  }

  const finalData: Row[] = groupBy(data, aggregationLevel, aggColumns);

  finalData.forEach((row) => {
    row.children = groupDataByColumnDefs(columns, aggColumns, row.children || [], groupOrder, level + 1);
    row.children.forEach((child) => {
      child._level = level + 1;
    });
  });

  return finalData;
};

export const getColumnArrayFromDefs = (columnStore: ColumnStore): Column[][] => {
  const columns = Object.values(columnStore).reduce((acc, column) => {
    if (!acc[column.level]) {
      acc[column.level] = [];
    }
    acc[column.level].push(column);
    return acc;
  }, [] as Column[][]);

  return columns;
};

const _getChildrenWidth = (column: Column, columnStore: ColumnStore): number => {
  if (column.hidden) {
    return 0;
  }
  if (!column.childrenId) {
    return column.width || MIN_COL_WIDTH;
  }

  return column.childrenId.reduce((acc, childId) => acc + _getChildrenWidth(columnStore[childId], columnStore), 0);
};

export const setColumnsStyleProps = (columnStore: ColumnStore, containeWidth: number): ColumnStore => {
  const finalColumns = Object.values(columnStore).filter((column) => column.final && !column.hidden);
  const notFinalColumns = Object.values(columnStore).filter((column) => !column.final && !column.hidden);
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
    column.width = Math.max(flexWidth, column.minWidth || MIN_COL_WIDTH);
  });

  // Calculate parent widths based on children
  notFinalColumns.forEach((column) => {
    column.width = _getChildrenWidth(column, columnStore);
  });

  return columnStore;
};

export const setColumnFilters = (columns: ColumnStore, data: Data) => {
  Object.values(columns).forEach((column) => {
    if (typeof data[0][column.field as string] === 'boolean') {
      column.filterType = FilterType.BOOLEAN;
      return;
    }
    if (typeof data[0][column.field as string] === 'string') {
      column.filterType = FilterType.TEXT;
      const values = Array.from(new Set(data.map((row) => row[column.field as string]))).sort() as IFilter[];

      column.filterOptions = values;
      return;
    }
    if (typeof data[0][column.field as string] === 'number') {
      column.filterType = FilterType.NUMBER;
      return;
    }
  });
};


export const initialize = (
  columns: ColumnStore,
  container: HTMLDivElement,
  data: Data,
  groupOrder: ColumnId[],
  tree?: Partial<TreeConstructor>
): Data => {
  if (tree) {
    groupOrder.forEach((id) => {
      const column = columns[id];

      const newColumn = createGroupColumn(column, columns, tree);
      if (tree && !tree.showOriginal) {
        toggleHide(column, columns);
      }
      newColumn.rowGroup = true;
    });
    setColumnsStyleProps(columns, container.offsetWidth);
  }
  const aggColumns = Object.values(columns).filter((c) => c.aggregation);
  const finalData = groupDataByColumnDefs(columns, aggColumns, data, groupOrder);
  setColumnsStyleProps(columns, container.offsetWidth);
  setColumnFilters(columns, data);

  return finalData;
};
