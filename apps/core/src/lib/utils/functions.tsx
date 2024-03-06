import { AggregationType, Column, Data, Row, SortType } from '../common';
import { v4 as uuidv4 } from 'uuid';

export const sortData =
  <TData,>(sortColumns: Column[]) =>
    (a: TData, b: TData) => {
      for (const column of sortColumns) {
        const valueA = a[column.field as keyof TData];
        const valueB = b[column.field as keyof TData];

        if (valueA > valueB) {
          return column.sort?.order === SortType.ASC ? 1 : -1;
        }
        if (valueA < valueB) {
          return column.sort?.order === SortType.ASC ? -1 : 1;
        }
      }
      return 0;
    };

const _calculate = <TData,>(data: TData[], column: Column) => {
  switch (column.aggregation) {
    case AggregationType.SUM:
      return data.reduce((acc, row) => acc + +row[column.field as keyof TData], 0);
    case AggregationType.AVG:
      return data.reduce((acc, row) => acc + +row[column.field as keyof TData], 0) / data.length;
    case AggregationType.COUNT:
      return data.length;
    default:
      return null;
  }
}

export const groupBy = (data: Data, column: Column, calculatedColumns: Column[]): Row[] => {
  const groups = data.reduce((acc, row) => {
    const key = `${row[column.field as keyof Row]}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<string, Row[]>);

  return Object.entries(groups).map(([key, children]) => {
    const calculatedFields = calculatedColumns.reduce((acc, column) => {
      acc[column.field as string] = _calculate(children, column);
      return acc;
    }, {} as Record<string, number | null>);
    
    return { [column.field as string]: key, _id: uuidv4(), children: children, ...calculatedFields };
  });
  
}

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
