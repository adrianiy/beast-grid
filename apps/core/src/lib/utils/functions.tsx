import { AggregationType, Column, Data, Row, SortType } from '../common';
import { v4 as uuidv4 } from 'uuid';

const _calculate = <TData,>(data: TData[], column: Column) => {
  switch (column.aggregation) {
    case AggregationType.SUM:
      return data.reduce((acc, row) => acc + +row[column.field as keyof TData], 0);
    case AggregationType.AVG:
      return data.reduce((acc, row) => acc + +row[column.field as keyof TData], 0) / data.length;
    case AggregationType.COUNT:
      return data.length;
    case AggregationType.MIN:
      return Math.min(...data.map((row) => row[column.field as keyof TData] as number));
    case AggregationType.MAX:
      return Math.max(...data.map((row) => row[column.field as keyof TData] as number));
    default:
      return null;
  }
};

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
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const sortData = (sortColumns: Column[]) => (a: Row, b: Row) => {
  for (const column of sortColumns) {
    const valueA = a[column.field as keyof Row] as number;
    const valueB = b[column.field as keyof Row] as number;

    if (valueA > valueB) {
      return column.sort?.order === SortType.ASC ? 1 : -1;
    }
    if (valueA < valueB) {
      return column.sort?.order === SortType.ASC ? -1 : 1;
    }
  }
  return (a._originalIdx as number) - (b._originalIdx as number);
};

export async function export_data(data: Data, columns: Column[]) {
  /* dynamically import the SheetJS Wrapper */
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.sort(sortData(columns)).map((row) => columns.map((column) => row[column.field as keyof Row])));
  XLSX.utils.sheet_add_aoa(ws, [columns.map((column) => column.headerName)], { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFileXLSX(wb, `export-${new Date().toISOString()}-delta-chat.xlsx`);
}
