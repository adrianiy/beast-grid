import { AggregationType, Column, ColumnDef, Data, Row } from '../common';
import { v4 as uuidv4 } from 'uuid';

const newRow = (row: Row, rows: Column[], showTotals: boolean, indexes: number[], isTotal?: boolean): Row => ({
    _id: uuidv4(),
    _expanded: true,
    _total: isTotal,
    _pivotIndexes: indexes,
    _singleChild: !showTotals,
    children: [],
    _childrenMap: {} as Record<string, number>,
    pivot_values: row.pivot_values,
    aggregation_type: row.aggregation_type,
    formatter: row.formatter,
    ...rows.reduce((acc, column) => ({ ...acc, [column.field as keyof Row]: row[column.field as keyof Row] }), {}),
});

const newColumn = (baseColumn: Column, key: string, field: string, parent: Partial<Column> | undefined, firstLevel: boolean, filters: Record<string, string>) => {
    const id = uuidv4();

    return {
        ...baseColumn,
        id,
        field,
        headerName: key,
        flex: 1,
        parent: parent?.id,
        children: [],
        childrenMap: {},
        menu: false,
        sort: undefined,
        path: parent?.path ? [...parent.path, parent.id] : [],
        _filters: filters,
        _firstLevel: firstLevel,
        _summary: firstLevel
    }
}

const addRow = (key: string, rowMap: Record<string, number>, result: Row[], row: Row, rows: Column[], index: number) => {
    if (rowMap[key] == null) {
        // Si agrupo totales de fila, necesito crear un padre por cada nivel de filas y concatenar los hijos a cada
        // padre
        result.push(newRow(row, rows, false, [index]));

        rowMap[key] = result.length - 1;
    } else {
        result[rowMap[key]]._pivotIndexes?.push(index);
    }
}

const createSingleRows = (result: Row[], rows: Column[], values: Column[], row: Row, rowMap: Record<string, number>, index: number) => {
    let key: string | null = '';

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].field === 'pivot_values') {
            values.forEach((value) => {
                key = key + '-' + value.field as string || 'total';

                for (let j = i + 1; j < rows.length; j++) {
                    key = key + '-' + row[rows[j].field as keyof Row] as string || 'total';
                }

                row['pivot_values'] = value.field as string || 'total';
                row['aggregation_type'] = value.aggregation as string || 'total';
                row['formatter'] = value.formatter;


                addRow(key, rowMap, result, row, rows, index);
            })

            key = null;
            break;
        }
        key = key + '-' + row[rows[i].field as keyof Row] as string || 'total';
    }

    if (key) {
        addRow(key, rowMap, result, row, rows, index);
    }
}

const addNestedRow = (key: string, parentRow: Row | undefined, row: Row, rows: Column[], result: Row[], rowMap: Record<string, number>, index: number, isFirst: boolean, isLast: boolean) => {
    if (isFirst) {
        // Parent Row
        if (rowMap[key] == null) {
            // Register parent row if not present in the map
            result.push(newRow(row, rows, !isLast, [index], !isLast));
            rowMap[key] = result.length - 1;
        } else {
            // Add pivot index to parent row
            result[rowMap[key]]._pivotIndexes?.push(index);
        }

        // save parent row
        return result[rowMap[key]];
    } else if (parentRow) {
        // Children row
        if (!parentRow._childrenMap || !parentRow.children) {
            throw new Error('Parent row is not properly initialized');
        }

        if (parentRow._childrenMap[key] == null) {
            // Register child row if not present in the map
            parentRow.children.push(newRow(row, rows, !isLast, [index], !isLast));
            parentRow._childrenMap[key] = parentRow.children.length - 1;
        } else {
            // Add pivot index to child row
            parentRow.children[parentRow._childrenMap[key]]._pivotIndexes?.push(index);
        }

        return parentRow.children[parentRow._childrenMap[key]];
    } else {
        throw new Error('Parent row is not defined');
    }
}

const createNestedrows = (result: Row[], rows: Column[], values: Column[], row: Row, rowMap: Record<string, number>, index: number) => {
    let parentRow: Row | undefined;
    const haveValueRow = rows.find((row) => row.field === 'pivot_values');

    for (let i = 0; i < rows.length; i++) {
        const key = row[rows[i].field as keyof Row] as string;
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;

        if (rows[i].field === 'pivot_values') {
            values.forEach((value) => {
                const valueKey = value.field as string || 'total';

                row['pivot_values'] = value.field as string || 'total';
                row['aggregation_type'] = value.aggregation as string || 'total';
                row['formatter'] = value.formatter;

                let valueParentRow = addNestedRow(valueKey, parentRow, row, rows, result, rowMap, index, isFirst, isLast);

                for (let j = i + 1; j < rows.length; j++) {
                    const key = row[rows[j].field as keyof Row] as string || 'total';
                    const isLast = j === rows.length - 1;

                    valueParentRow = addNestedRow(key, valueParentRow, row, rows, result, rowMap, index, false, isLast);
                }
            })

            break;
        }

        parentRow = addNestedRow(key, parentRow, row, rows, result, rowMap, index, isFirst, isLast)

        if (haveValueRow) {
            parentRow.formatter = () => '';
            parentRow._pivotIndexes = [];
        }
    }
}

const createColumn = (column: Column, row: Row, lastField: string, filters: Record<string, any>, columnDefs: Record<string, ColumnDef>) => {
    const field = `${column.field}:${row[column.field as keyof Row] as string}@${lastField}`;
    filters[column.field as string] = row[column.field as keyof Row] as string;

    if (!columnDefs[field]) {
        columnDefs[field] = newColumn(column, column.formatter?.(row[column.field as keyof Row] as string & number, row) || row[column.field as keyof Row] as string, 'non_value', columnDefs[lastField], false, { ...filters });

        if (lastField) {
            columnDefs[lastField].children?.push(columnDefs[field]);
        }
    }
    lastField = field;

    return lastField;
}

const createLastColumn = (column: Column, value: Column, row: Row, lastField: string, filters: Record<string, any>, columnDefs: Record<string, ColumnDef>) => {
    const valueField = `${column.field}:${row[column.field as keyof Row]}:${value.field as string}@${lastField}`;

    if (!columnDefs[valueField]) {
        columnDefs[valueField] = newColumn(value, column.formatter?.(row[column.field as keyof Row] as string & number, row) || row[column.field as keyof Row] as string, value.field as string, columnDefs[lastField], false, filters);

        if (lastField) {
            columnDefs[lastField]?.children?.push(columnDefs[valueField]);
        }
    }

    return valueField;
}

const createValueColumn = (value: Column, lastField: string, filters: Record<string, any>, columnDefs: Record<string, ColumnDef>) => {
    const valueField = `${value.field as string}@${lastField}`;

    if (!columnDefs[valueField]) {
        columnDefs[valueField] = newColumn(value, value.headerName as string, value.field as string, columnDefs[lastField], false, filters);

        if (lastField) {
            columnDefs[lastField]?.children?.push(columnDefs[valueField]);
        }
    }

    return valueField;
}

export const groupByPivot = (
    data: Data,
    rows: Column[],
    columns: Column[],
    values: Column[],
    showRowTotals: boolean,
): [Row[], Row[], ColumnDef[]] => {
    const rowMap: Record<string, number> = {};
    const columnDefs: Record<string, ColumnDef> = {};
    const _rows: Row[] = [];
    const _bottomRows: Row[] = [];

    // If not values, add a total column
    if (!values.length) {
        values.push({ field: 'total:', aggregation: AggregationType.SUM } as Column);
    }

    const summaryId = 'summary';
    const summaryColumn = newColumn({} as Column, columns.map((column) => column.headerName).join(' > '), 'summary', undefined, true, {});
    columnDefs[summaryId] = summaryColumn;

    data.forEach((row, index) => {
        // for single rows
        if (!showRowTotals) {
            createSingleRows(_rows, rows, values, row, rowMap, index);
        } else {
            createNestedrows(_rows, rows, values, row, rowMap, index);
        }

        let lastField = summaryId;
        const filters: Record<string, string> = {};

        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];

            if (column.field === 'pivot_values') {
                values.forEach((value) => {
                    let valueLastField = lastField;
                    const lastColumn = i === columns.length - 1;

                    if (lastColumn) {
                        createValueColumn(value, valueLastField, filters, columnDefs);
                    } else {
                        valueLastField = createValueColumn(value, valueLastField, filters, columnDefs);
                    }

                    for (let j = i + 1; j < columns.length; j++) {
                        const lastColumn = j === columns.length - 1;

                        if (lastColumn) {
                            createLastColumn(columns[j], value, row, valueLastField, filters, columnDefs);
                        } else {
                            valueLastField = createColumn(columns[j], row, valueLastField, filters, columnDefs);
                        }
                    }
                });

                break;
            }

            lastField = createColumn(column, row, lastField, filters, columnDefs);
        }
    });

    if (showRowTotals) {
        // Add bottom row totals
        const totalRow = { [rows[0].field as string]: 'Total' } as Row;
        const allIndexes = data.map((_, i) => i);

        _bottomRows.push(newRow(totalRow, rows, false, allIndexes, true));
    }

    console.log(Object.keys(rowMap).length, Object.keys(columnDefs).length);

    return [_rows, _bottomRows, Object.values(columnDefs)];
};

export const groupPivot = (
    columns: Column[],
    aggColumns: Column[],
    valueColumns: Column[],
    data: Data,
    showRowTotals: boolean,
    level = 0
): [Data, Data, ColumnDef[]] => {
    if (columns.length && level === columns.length) {
        return [data, [], []];
    }
    return groupByPivot(data, columns, aggColumns, valueColumns, showRowTotals);
};

