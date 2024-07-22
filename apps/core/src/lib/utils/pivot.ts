import { AggregationType, Column, ColumnDef, Data, Row } from '../common';
import { v4 as uuidv4 } from 'uuid';

const newRow = (row: Row, rows: Column[], showTotals: boolean, indexes: number[], isTotal?: boolean): Row => ({
    _id: uuidv4(),
    _expanded: true,
    _total: isTotal,
    _pivotIndexes: indexes,
    _singleChild: !showTotals,
    children: [],
    childrenMap: {},
    ...rows.reduce((acc, column) => ({ ...acc, [column.field as keyof Row]: row[column.field as keyof Row] }), {}),
});

const newColumn = (baseColumn: Column, key: string, field: string, parentId: string | undefined, firstLevel: boolean, filters: Record<string, string>) => ({
    ...baseColumn,
    id: uuidv4(),
    field,
    headerName: key,
    flex: 1,
    parent: parentId,
    children: [],
    childrenMap: {},
    menu: false,
    _filters: filters,
    _firstLevel: firstLevel,
    _summary: firstLevel
})

export const groupByPivot = (
    data: Data,
    rows: Column[],
    columns: Column[],
    values: Column[],
    showRowTotals: boolean
): [Row[], ColumnDef[]] => {
    const rowMap: Record<string, number> = {};
    const columnDefs: Record<string, ColumnDef> = {};
    const _rows: Row[] = [];

    // If not values, add a total column
    if (!values.length) {
        values.push({ field: 'total:', aggregation: AggregationType.SUM } as Column);
    }

    const summaryId = 'summary';
    const summaryColumn = newColumn({} as Column, columns.map((column) => column.headerName).join(' > '), 'summary', undefined, true, {});
    columnDefs[summaryId] = summaryColumn;

    data.forEach((row, index) => {
        // Get row group key
        const key = rows.map((groupRow) => row[groupRow.field as keyof Row]).join('-') || 'total';

        if (!rowMap[key]) {
            _rows.push(newRow(row, rows, showRowTotals, [index]));

            rowMap[key] = _rows.length - 1;
        } else {
            _rows[rowMap[key]]._pivotIndexes?.push(index);
        }

        values.forEach((column) => {
            let lastField = summaryId;
            const filters: Record<string, string> = {};

            columns.forEach((column, index) => {
                const field = `${column.field}:${row[column.field as keyof Row] as string}@${lastField}`;
                filters[column.field as string] = row[column.field as keyof Row] as string;

                if (!columnDefs[field]) {
                    columnDefs[field] = newColumn(column, row[column.field as keyof Row] as string, field, columnDefs[lastField]?.id, false, {});

                    if (lastField) {
                        columnDefs[lastField].children?.push(columnDefs[field]);
                    }
                }
                lastField = field;
            })
            const valueField = `${column.field as string}@${lastField}`;

            if (!columnDefs[valueField]) {
                columnDefs[valueField] = newColumn(column, column.headerName as string, column.field as string, columnDefs[lastField]?.id, false, filters);

                if (lastField) {
                    columnDefs[lastField]?.children?.push(columnDefs[valueField]);
                }
            }
        });
    })

    console.log(Object.keys(rowMap).length, Object.keys(columnDefs).length);

    return [_rows, Object.values(columnDefs)];
};

export const groupPivot = (
    columns: Column[],
    aggColumns: Column[],
    valueColumns: Column[],
    data: Data,
    showRowTotals: boolean,
    level = 0
): [Data, ColumnDef[]] => {
    if (columns.length && level === columns.length) {
        return [data, []];
    }
    return groupByPivot(data, columns, aggColumns, valueColumns, showRowTotals);
};

