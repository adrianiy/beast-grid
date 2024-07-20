import { useRef } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import {
    AggregationFunction,
    AggregationType,
    Chart,
    Column,
    ColumnDef,
    ColumnStore,
    Data,
    FilterType,
    Formula,
    IFilter,
    MathCell,
    MathType,
    NumberFilter,
    Operand,
    Operation,
    OperationType,
    Row,
    SortType,
} from '../common';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { parseFormula } from './math';

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
    columns: ColumnStore,
    aggregationColumns?: Column[],
): Row[] => {
    const aggTypeColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'string');
    const aggFuncColumns = calculatedColumns.filter((column) => typeof column.aggregation === 'function');

    return Object.entries(groups).map(([key, children]) => {
        const calculatedFields = aggTypeColumns.reduce(
            (acc, column) => {
                if (aggregationColumns) {
                    const setChildrenFieldsByAggregation = (aggColumn: Column) => {
                        const [, rest] = (aggColumn.field || '').split('@');
                        children.forEach((child) => {
                            if (rest) {
                                const match = rest?.split('&').map((filterField) => {
                                    const [aggField, aggValue] = filterField.split(':');
                                    return `${child[aggField as keyof Row]}` === aggValue;
                                });

                                if (match?.every(Boolean)) {
                                    child[field] = child[field as keyof Row];
                                }
                            } else {
                                child[field] = child[field as keyof Row];
                            }
                        });

                        acc[aggColumn.field as string] = _calculate(children, aggColumn) || null;

                        if (aggColumn.childrenId) {
                            aggColumn.childrenId.forEach((aggChildColumn) => {
                                setChildrenFieldsByAggregation(columns[aggChildColumn]);
                            });
                        }
                    };
                    aggregationColumns.forEach((aggColumn) => {
                        setChildrenFieldsByAggregation(aggColumn);
                    });
                } else {
                    acc[column.field as string] = _calculate(children, column) || null;
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

export const groupBy = (data: Data, column: Column, calculatedColumns: Column[], columns: ColumnStore): Row[] => {
    const groups = data.reduce((acc, row) => {
        const key = `${row[column.field as keyof Row]}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(row);
        return acc;
    }, {} as Record<string, Row[]>);

    return getGroupRows(groups, column.field as string, calculatedColumns, columns, undefined);
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

export const aggregateData = (
    data: Row,
    row: Row,
    calculatedColumn: Column,
    valueField: string
): Row => {
    const value = getFieldValue(row, valueField);
    if (calculatedColumn.aggregation === AggregationType.SUM) {
        data[valueField] = +(data[valueField] || 0) + value;
    } else if (calculatedColumn.aggregation === AggregationType.AVG) {
        data[`count:${valueField}`] = +(data[`count:${valueField}`] || 0) + 1;
        data[`abs:${valueField}`] = +(data[`abs:${valueField}`] || 0) + value;

        data[valueField] = data[`abs:${valueField}`] as number / (data[`count:${valueField}`] as number);
    } else if (calculatedColumn.aggregation === AggregationType.COUNT) {
        data[valueField] = +(data[valueField] || 0) + 1;
    } else if (calculatedColumn.aggregation === AggregationType.MIN) {
        data[valueField] = Math.min(data[valueField] as number || Infinity, value);
    } else if (calculatedColumn.aggregation === AggregationType.MAX) {
        data[valueField] = Math.max(data[valueField] as number || -Infinity, value);
    }

    return data;
}

const doPivotOperation = (formula: Operand | null, column: Column, rows: Row[]): number => {
    if (!formula) {
        return 0;
    }
    if (formula.type === MathType.CELL) {
        const cell = formula as MathCell;

        if (!isNaN(+cell.cell)) {
            return +cell.cell;
        }

        return rows.reduce((acc, curr) => aggregateData(acc, curr, column, cell.cell), {})[cell.cell] as number;
    }

    const operation = formula as Formula;

    switch (operation.operation) {
        case Operation.ADD:
            return doPivotOperation(operation.left, column, rows) + doPivotOperation(operation.right, column, rows);
        case Operation.SUBTRACT:
            return doPivotOperation(operation.left, column, rows) - doPivotOperation(operation.right, column, rows);
        case Operation.MULTIPLY:
            return doPivotOperation(operation.left, column, rows) * doPivotOperation(operation.right, column, rows);
        case Operation.DIVIDE:
            return doPivotOperation(operation.left, column, rows) / doPivotOperation(operation.right, column, rows);
        case Operation.POWER:
            return doPivotOperation(operation.left, column, rows) ** doPivotOperation(operation.right, column, rows);
        default:
            return 0;
    }
}

const getPivotFormula = (field: string, column: Column, rows: Row[]) => {
    const jsonFormula = parseFormula(field);

    return doPivotOperation(jsonFormula as Operand, column, rows);
}

export const getPivotedData = (row: Row, column: Column, data: Data): number | string => {
    if (row._pivotIndexes) {
        const field = column.field;
        let rows = row._pivotIndexes.map((index) => data[index]);

        if (column._filters) {
            const filter = column._filters;

            rows = rows.filter((row) => Object.keys(filter).every((key) => row[key] === filter[key]));

            if (!rows.length) {
                return 0;
            }

        }

        // NOTE: Test this with a real case
        const mathField = field.startsWith('#{');

        if (mathField) {
            return getPivotFormula(field, column, rows);
        }

        const reduced = rows.reduce((acc, curr) => aggregateData(acc, curr, column, field!), {});

        return reduced[field as string] as number;
    }

    const field = column.field;

    return getFieldValue(row, field as string) as number | string;
}

export const sortData = (sortColumns: Column[], data: Data = []) => (a: Row, b: Row) => {
    for (const column of sortColumns) {
        const valueA = getPivotedData(a, column, data)
        const valueB = getPivotedData(b, column, data)

        if (valueA > valueB) {
            return column.sort?.order === SortType.ASC ? 1 : -1;
        }
        if (valueA < valueB) {
            return column.sort?.order === SortType.ASC ? -1 : 1;
        }
    }
    return (a._originalIdx as number) - (b._originalIdx as number);
};

export const resetSortColumns = (sortColumns: Column[]) => {
    for (const column of sortColumns) {
        if (column.sort?.temporal) {
            column.sort = undefined;
        }
    }
}

export const filterRow =
    (columns: ColumnStore, filters: Record<string, IFilter[]>) =>
        (row: Row): Row | undefined => {
            let show = true;
            let children = row.children;

            for (const filterKey of Object.keys(filters)) {
                if (
                    columns[filterKey].filterType === FilterType.TEXT &&
                    filters[filterKey].includes(
                        `${row[columns[filterKey].field as string]}`
                    )
                ) {
                    show = show && true;
                } else if (columns[filterKey].filterType === FilterType.NUMBER) {
                    const rowValue = row[columns[filterKey].field as keyof Row] as number;
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
            row._hidden = !show;

            return row;
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

export function cloneColumns(columnStore: ColumnStore): ColumnStore {
    const newObject: ColumnStore = {};

    Object.keys(columnStore).forEach((key) => {
        newObject[key] = JSON.parse(JSON.stringify(columnStore[key]));
        newObject[key].formatter = columnStore[key].formatter;
        newObject[key].styleFormatter = columnStore[key].styleFormatter;
        newObject[key].aggregation = columnStore[key].aggregation;
    })

    return newObject;
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

const convertToTotal = (column: Column, headerName: string, parentField: string, values: Column[]): ColumnDef[] => {
    if (column.children && column.children?.length) {
        column.id = uuidv4();
        column.headerName = headerName;
        column.field = parentField;
        column.childrenMap = {};
        column.children = convertToTotal(
            { ...column.children[0], parent: column.id } as Column,
            '',
            parentField,
            values
        );

        return [column];
    } else {
        return values.map((value) => ({
            id: uuidv4(),
            formatter: value.formatter,
            headerName: `${value.aggregation} of ${value.headerName}`,
            field: `${value.field}@${parentField}`,
            filterType: FilterType.NUMBER,
            flex: 1,
            parent: column.id,
            children: [],
            childrenMap: {},
            _total: true,
            _firstLevel: false,
        }));
    }
};

const loopColumn = (column: ColumnDef, values: Column[]) => {
    const isLeaf = column.children?.some((child) => !child.children?.length);
    if (column.children?.length && !isLeaf) {
        column.children?.push(
            ...convertToTotal(
                { ...column.children[0], parent: column.id } as Column,
                'TOTAL',
                column.field as string,
                values
            )
        );

        column.children?.forEach((child) => {
            loopColumn(child, values);
        });
    }
};

export function getSumatoryColumns(columns: ColumnDef[], values: Column[]): ColumnDef[] {
    columns.forEach((column) => {
        loopColumn(column, values);
    });

    return columns;
}

const doOperation = (formula: Operand | null, row: Row): number => {
    if (!formula) {
        return 0;
    }
    if (formula.type === MathType.CELL) {
        const cell = formula as MathCell;

        if (!isNaN(+cell.cell)) {
            return +cell.cell;
        }
        return row[(formula as MathCell).cell] as number;
    }

    const operation = formula as Formula;

    switch (operation.operation) {
        case Operation.ADD:
            return doOperation(operation.left, row) + doOperation(operation.right, row);
        case Operation.SUBTRACT:
            return doOperation(operation.left, row) - doOperation(operation.right, row);
        case Operation.MULTIPLY:
            return doOperation(operation.left, row) * doOperation(operation.right, row);
        case Operation.DIVIDE:
            return doOperation(operation.left, row) / doOperation(operation.right, row);
        case Operation.POWER:
            return doOperation(operation.left, row) ** doOperation(operation.right, row);
        default:
            return 0;
    }
}

const getMathValue = (row: Row, field: string): number => {
    const jsonFormula = parseFormula(field);

    return doOperation(jsonFormula as Operand, row);
}

export const getFieldValue = (row: Row, field: string): string | number | React.ReactElement => {
    if (field.startsWith('#{')) {
        return getMathValue(row, field) || 0;
    } else {
        return row[field as keyof Row] as string | number | React.ReactElement
    }
}
