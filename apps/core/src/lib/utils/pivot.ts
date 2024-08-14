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

const createSingleRows = (result: Row[], rows: Column[], row: Row, rowMap: Record<string, number>, index: number) => {
    const key = rows.map((groupRow) => row[groupRow.field as keyof Row]).join('-') || 'total';

    if (rowMap[key] == null) {
        // Si agrupo totales de fila, necesito crear un padre por cada nivel de filas y concatenar los hijos a cada
        // padre
        result.push(newRow(row, rows, false, [index]));

        rowMap[key] = result.length - 1;
    } else {
        result[rowMap[key]]._pivotIndexes?.push(index);
    }
}

const createNestedrows = (result: Row[], rows: Column[], row: Row, rowMap: Record<string, number>, index: number) => {
    let parentRow: Row | undefined;

    rows.forEach((groupRow, i) => {
        const key = row[groupRow.field as keyof Row] as string;
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;

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
            parentRow = result[rowMap[key]];
        } else if (parentRow) {
            // Children row
            if (!parentRow._childrenMap || !parentRow.children) {
                throw new Error('Parent row is not properly initialized');
            }

            if (!parentRow._childrenMap[key]) {
                // Register child row if not present in the map
                parentRow.children.push(newRow(row, rows, !isLast, [index], !isLast));
                parentRow._childrenMap[key] = parentRow.children.length - 1;
            } else {
                // Add pivot index to child row
                parentRow.children[parentRow._childrenMap[key]]._pivotIndexes?.push(index);
            }
        } else {
            throw new Error('Parent row is not defined');
        }
    });
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
            createSingleRows(_rows, rows, row, rowMap, index);
        } else {
            createNestedrows(_rows, rows, row, rowMap, index);
        }

        // for each value build column hierarchy
        values.forEach((column) => {
            let lastField = summaryId;
            const filters: Record<string, string> = {};

            columns.forEach((column) => {
                const field = `${column.field}:${row[column.field as keyof Row] as string}@${lastField}`;
                filters[column.field as string] = row[column.field as keyof Row] as string;

                if (!columnDefs[field]) {
                    columnDefs[field] = newColumn(column, row[column.field as keyof Row] as string, field, columnDefs[lastField], false, { ...filters });

                    if (lastField) {
                        columnDefs[lastField].children?.push(columnDefs[field]);
                    }
                }
                lastField = field;
            })
            const valueField = `${column.field as string}@${lastField}`;

            if (!columnDefs[valueField]) {
                columnDefs[valueField] = newColumn(column, column.headerName as string, column.field as string, columnDefs[lastField], false, filters);

                if (lastField) {
                    columnDefs[lastField]?.children?.push(columnDefs[valueField]);
                }
            }
        });
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

