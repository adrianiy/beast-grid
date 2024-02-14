import { Column, SortType } from '../common';

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
