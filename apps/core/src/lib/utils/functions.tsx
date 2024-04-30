import { useRef } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import {
    AggregationFunction,
    AggregationType,
    Chart,
    Column,
    ColumnStore,
    Data,
    FilterType,
    IFilter,
    NumberFilter,
    OperationType,
    Row,
    SortType,
} from '../common';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const _calculate = <TData,>(data: TData[], column: Column) => {
    switch (column.aggregation) {
        case AggregationType.SUM:
            return data.reduce((acc, row) => acc + +(row[column.field as keyof TData] || 0), 0);
        case AggregationType.AVG:
            return data.reduce((acc, row) => acc + +(row[column.field as keyof TData] || 0), 0) / data.length;
        case AggregationType.COUNT:
            return data.length;
        case AggregationType.COUNT_DISTINCT:
            return new Set(data.map((row) => row[column.field as keyof TData]).filter(Boolean)).size;
        case AggregationType.MIN:
            return Math.min(...data.map((row) => (+row[column.field as keyof TData] || Infinity) as number));
        case AggregationType.MAX:
            return Math.max(...data.map((row) => (+row[column.field as keyof TData] || -Infinity) as number));
        default:
            return null;
    }
};

const getGroupRows = (
    groups: Record<string, Row[]>,
    field: string,
    calculatedColumns: Column[],
    aggregationColumns?: Column[]
): Row[] => {
    const aggTypeColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'string');
    const aggFuncColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'function');

    return Object.entries(groups).map(([key, children]) => {
        const calculatedFields = aggTypeColumns.reduce(
            (acc, column) => {
                if (aggregationColumns) {
                    const setChildrenFieldsByAggregation = (aggColumn: Column) => {
                        const [, rest] = (aggColumn.pivotField || '').split('@');
                        children.forEach((child) => {
                            if (rest) {
                                const match = rest?.split('&').map((filterField) => {
                                    const [aggField, aggValue] = filterField.split(':');
                                    return `${child[aggField as keyof Row]}` === aggValue;
                                });

                                if (match?.every(Boolean)) {
                                    child[aggColumn.pivotField as string] = child[field as keyof Row];
                                }
                            } else {
                                child[aggColumn.pivotField as string] = child[field as keyof Row];
                            }
                        });

                        acc[aggColumn.pivotField as string] = _calculate(children, aggColumn) || null;

                        if (aggColumn.children) {
                            aggColumn.children.forEach((aggChildColumn) => {
                                setChildrenFieldsByAggregation(aggChildColumn as Column);
                            });
                        }
                    };
                    aggregationColumns.forEach((aggColumn) => {
                        console.log('aggColumn', aggColumn);
                        setChildrenFieldsByAggregation(aggColumn);
                    });
                } else {
                    const data = _calculate(children, column);
                    console.log(`${column.field}@${field}:${key}`, children.length,  data);
                    acc[`${column.field}@${field}:${key}`] = data || null;
                }
                return acc;
            },
            children.length > 1 ? ({} as Record<string, number | null>) : children[0]
        );

        const newRow = {
            [field]: key,
            _id: uuidv4(),
            _singleChild: children.length === 1,
            ...calculatedFields,
            children,
        };

        if (children.length <= 1) {
            return newRow;
        }
        const computedFields = aggFuncColumns.reduce((acc, column) => {
            acc[column.field as string] = (column.aggregation as AggregationFunction)(newRow);
            return acc;
        }, {} as Record<string, number | string | null>);

        return { ...newRow, ...computedFields };
    });
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

    return getGroupRows(groups, column.field as string, calculatedColumns);
};

export const groupByMultiple = (
    data: Data,
    columns: Column[],
    calculatedColumns: Column[],
    aggregationColumns?: Column[]
): Row[] => {
    const groups = data.reduce((acc, row) => {
        const key = columns.length ? columns.map((column) => `${row[column.field as keyof Row]}`).join('_') : 'main';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(row);
        return acc;
    }, {} as Record<string, Row[]>);

    return getGroupRows(groups, columns.map((c) => c.headerName).join('_'), calculatedColumns, aggregationColumns);
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

export const filterRow =
    (columns: ColumnStore, filters: Record<string, IFilter[]>) =>
    (row: Row): Row | undefined => {
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
        if (row.children && !row._singleChild) {
            children = row.children.map(filterRow(columns, filters)).filter(Boolean) as Row[];
            show = children.length > 0;
        }
        if (show) {
            return { ...row, children };
        }
    };

export const useThrottle = () => {
    const throttleSeed = useRef<NodeJS.Timeout | null>(null);

    const throttleFunction = useRef((func: () => void, delay = 200) => {
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

export const getCategories = (columns: Column[], data: Data) => {
    const rowZero = data[0];
    const stringCategories = columns.filter((column) => typeof rowZero[column.field as keyof Row] === 'string');

    return stringCategories;
};

export const getSeries = (columns: Column[], data: Data, chartConfig?: Partial<Chart>) => {
    if (chartConfig?.defaultValues?.dataColumns) {
        return columns.filter((column) => chartConfig.defaultValues?.dataColumns?.includes(column.field as string));
    }

    const rowZero = data[0];
    const numberSeries = columns.filter(
        (column) => column.final && !isNaN(+(rowZero[column.field as keyof Row] as number))
    );

    return numberSeries;
};

export const getDates = (columns: Column[], data: Data) => {
    const rowZero = data[0];
    return columns.filter((column) => dayjs(rowZero[column.field as keyof Row] as string).isValid());
};

export function clone<T>(obj: T): T {
    return cloneDeep(obj);
}

export function getAggregationType(column: Column | undefined, row: Row): AggregationType | AggregationFunction {
    if (column?.aggregation && typeof column.aggregation === 'string') {
        return column.aggregation;
    }

    if (typeof row[column?.field as keyof Row] === 'number') {
        return AggregationType.SUM;
    }

    return AggregationType.COUNT;
}
