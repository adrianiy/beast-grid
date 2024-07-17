import { AggregationType, Column, ColumnDef, Data, Row } from '../common';
import { v4 as uuidv4 } from 'uuid';

const newRow = (showTotals: boolean, indexes: number[], isTotal?: boolean): Row => ({
    _id: uuidv4(),
    _expanded: true,
    _total: isTotal,
    _pivotIndexes: indexes,
    _singleChild: !showTotals,
    children: [],
    childrenMap: {},
});

const newColumn = (baseColumn: Column, key: string, field: string, parentId: string | undefined, index: number, filters: Record<string, string>) => ({
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
    _firstLevel: !index,
})

export const groupByPivot = (
    data: Data,
    rows: Column[],
    columns: Column[],
    values: Column[],
    showRowTotals: boolean
): [Row[], ColumnDef[]] => {
    const rowSize: Record<string, Row> = {};
    const _rows: Row[] = [];
    const columnDefs: Record<string, ColumnDef> = {};

    if (!values.length) {
        values.push({ field: 'total:', aggregation: AggregationType.SUM } as Column);
    }

    data.forEach((row, index) => {
        const key = rows.map((groupRow) => row[groupRow.field as keyof Row]).join('-') || 'total';

        if (!rowSize[key]) {
            rowSize[key] = newRow(showRowTotals, [index]);
        } else {
            rowSize[key]._pivotIndexes?.push(index);
        }

        values.forEach((column) => {
            let lastField = ``;
            const filters: Record<string, string> = {};

            columns.forEach((column, index) => {
                const field = `${column.field}:${row[column.field as keyof Row] as string}@${lastField}`;
                filters[column.field as string] = row[column.field as keyof Row] as string;

                if (!columnDefs[field]) {
                    columnDefs[field] = newColumn(column, row[column.field as keyof Row] as string, field, columnDefs[lastField]?.id, index, {});

                    if (lastField) {
                        columnDefs[lastField]?.children?.push(columnDefs[field]);
                    }
                }
                lastField = field;
            })
            const valueField = `${column.field as string}@${lastField}`;

            if (!columnDefs[valueField]) {
                columnDefs[valueField] = newColumn(column, column.headerName as string, column.field as string, columnDefs[lastField]?.id, columns.length, filters);

                if (lastField) {
                    columnDefs[lastField]?.children?.push(columnDefs[valueField]);
                }
            }
        });
    })

    console.log(Object.keys(rowSize).length, Object.keys(columnDefs).length);

    Object.keys(rowSize).forEach((key) => {
        const row = rowSize[key];
        const index = row._pivotIndexes?.[0];

        if (index != undefined) {
            rows.forEach((groupRow) => {
                row[groupRow.field as string] = data[index][groupRow.field as keyof Row];
            });

            _rows.push(row);
        }
    });

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

