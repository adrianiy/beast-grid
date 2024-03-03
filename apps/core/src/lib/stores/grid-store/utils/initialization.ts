import { v4 as uuidv4 } from 'uuid';
import { ColumnDef, ColumnStore, Column, Data, Row, IFilter } from "../../../common";

import { MIN_COL_WIDTH } from './../../../common/globals';
import { groupBy } from '../../../utils/functions';

import deepmerge from 'deepmerge';

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
      pinned: parent?.pinned || columnDef.pinned,
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

export const groupDataByColumnDefs = (columns: ColumnStore, data: Data): Data => {
  const aggregationLevels = Object.values(columns).filter((c) => c.aggregationLevel);
  const aggregatedColumns = Object.values(columns).filter((c) => c.aggregation);

  let finalData: Row[] = data;
  aggregationLevels.forEach((column) => {
    finalData = groupBy(finalData, column, aggregatedColumns);
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
    column.width = Math.max(flexWidth, column.minWidth || MIN_COL_WIDTH);
    if (column.parent) {
      columnStore[column.parent].width += column.width;
    }
  });

  return columnStore;
};

export const setColumnFilters = (columns: ColumnStore, data: Data) => {
  Object.values(columns).forEach((column) => {
    if (column.menu?.filter && column.field) {
      const values = Array.from(new Set(data.map((row) => row[column.field as string]))).sort() as IFilter[];

      column.filterOptions = values;
    }
  });
};

export const initialize = (columns: ColumnStore, container: HTMLDivElement, data: Data): Data => {
  const finalData = groupDataByColumnDefs(columns, data);
  setColumnsStyleProps(columns, container.offsetWidth);
  setColumnFilters(columns, data);

  return finalData;
};

