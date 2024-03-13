import { useRef } from 'react';
import { AggregationFunction, AggregationType, Column, ColumnStore, Data, FilterType, IFilter, NumberFilter, OperationType, Row, SortType } from '../common';
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

  const aggTypeColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'string');
  const aggFuncColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'function');

  return Object.entries(groups).map(([key, children]) => {
    const calculatedFields = aggTypeColumns.reduce((acc, column) => {
      acc[column.field as string] = _calculate(children, column);
      return acc;
    }, {} as Record<string, number | null>);

    const newRow =  { [column.field as string]: key, _id: uuidv4(), children: children, ...calculatedFields };

    const computedFields = aggFuncColumns.reduce((acc, column) => {
      acc[column.field as string] = (column.aggregation as AggregationFunction)(newRow)
      return acc;
    }, {} as Record<string, number | string | null>);

    return { ...newRow, ...computedFields };
    
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

export const filterRow = (columns: ColumnStore, filters: Record<string, IFilter[]>) => (row: Row): Row | undefined => {
  let show = true;
  let children = row.children;

  for (const filterKey of Object.keys(filters)) {
    if (
      columns[filterKey].filterType === FilterType.TEXT &&
      filters[filterKey].includes(`${row[columns[filterKey].field as string]}`)
    ) {
      show = show && true;
    } else if (columns[filterKey].filterType === FilterType.NUMBER) {
      const rowValue = row[columns[filterKey].field as string] as number;
      const numberFilter = filters[filterKey] as NumberFilter[];
      for (const filter of numberFilter) {
        const op = filter.op;
        const value = filter.value || 0;

        if (op === OperationType.EQUAL) {
          show = show && rowValue === value;
        } else if (op === OperationType.GREATER_THAN) {
          show = show && rowValue > value;
        } else if (op === OperationType.LESS_THAN) {
          show = show && rowValue < value;
        } else if (op === OperationType.GREATER_THAN_OR_EQUAL) {
          show = show && rowValue >= value;
        } else if (op === OperationType.LESS_THAN_OR_EQUAL) {
          show = show && rowValue <= value;
        } else if (op === OperationType.NOT_EQUAL) {
          show = show && rowValue !== value;
        }
      }
    } else {
      show = show && false;
    }
  }
  if (row.children) {
    children = row.children.map(filterRow(columns, filters)).filter(Boolean) as Row[];
    show = children.length > 0;
  }
  if (show) {
    return { ...row, children };
  }
};

export const useThrottle = () => {
  const throttleSeed = useRef<NodeJS.Timeout | null>(null);

  const throttleFunction = useRef((func: () => void, delay=200) => {
    if (!throttleSeed.current) {
      // Call the callback immediately for the first time
      func();
      throttleSeed.current = setTimeout(() => {
        throttleSeed.current = null;
      }, delay);
    }
  });

  return throttleFunction.current;
};

export const useDebounce = () => {
  // here debounceSeed is defined to keep track of the setTimout function
  const debounceSeed = useRef<NodeJS.Timeout | null>(null);
  // a fucntion is created via useRef which
  // takes a function and a delay (in milliseconds) as an argument
  // which has a defalut value set to 200 , can be specified as per need
  const debounceFunction = useRef((func: () => void, timeout = 200) => {
   // checks if previosus timeout is present then it will clrear it
    if (debounceSeed.current) {
      clearTimeout(debounceSeed.current);
      debounceSeed.current = null;
    }
   // creates a timeout function witht he new fucntion call
    debounceSeed.current = setTimeout(() => {
      func();
    }, timeout);
  });
  // a debounce function is returned
  return debounceFunction.current;
};
