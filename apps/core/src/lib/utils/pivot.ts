import { AggregationType, Column, ColumnDef, Data, FilterType, Row } from '../common';
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

const newColumn = (key: string, field: string, parentId: string | undefined, index: number, filters: Record<string, string>, filterType?: FilterType, aggregation?: Column['aggregation']) => ({
    id: uuidv4(),
    headerName: key,
    pivotField: field,
    flex: 1,
    parent: parentId,
    children: [],
    childrenMap: {},
    menu: false,
    filterType,
    aggregation,
    _filters: filters,
    _firstLevel: !index,
})

interface RowConfig {
    row: Row;
    index: number;
}

export const groupByPivot = (
    data: Data,
    groupRows: Column[],
    columns: Column[],
    calculatedColumns: Column[],
    showRowTotals: boolean
): [Row[], ColumnDef[]] => {
    const rowSize: Record<string, RowConfig> = {};
    const rows: Row[] = [];
    const columnDefs: Record<string, ColumnDef> = {};

    if (!calculatedColumns.length) {
        calculatedColumns.push({ field: 'total:', aggregation: AggregationType.SUM } as Column);
    }

    data.forEach((row, index) => {
        const key = groupRows.map((groupRow) => row[groupRow.field as keyof Row]).join('-') || 'total';

        if (!rowSize[key]) {
            rowSize[key] = {
                row: newRow(showRowTotals, [index]),
                index
            };
        } else {
            rowSize[key].row._pivotIndexes?.push(index);
        }

        calculatedColumns.forEach((column) => {
            let lastField = ``;
            const filters: Record<string, string> = {};

            columns.forEach((column, index) => {
                const field = `${column.field}:${row[column.field as keyof Row] as string}@${lastField}`;
                filters[column.field as string] = row[column.field as keyof Row] as string;

                if (!columnDefs[field]) {
                    columnDefs[field] = newColumn(row[column.field as keyof Row] as string, field, columnDefs[lastField]?.id, index, {});

                    if (lastField) {
                        columnDefs[lastField]?.children?.push(columnDefs[field]);
                    }
                }
                lastField = field;
            })
            const valueField = `${column.field as string}@${lastField}`;

            if (!columnDefs[valueField]) {
                columnDefs[valueField] = newColumn(column.headerName as string, column.field as string, columnDefs[lastField]?.id, columns.length, filters, FilterType.NUMBER, column.aggregation);

                if (lastField) {
                    columnDefs[lastField]?.children?.push(columnDefs[valueField]);
                }
            }
        });
    })

    console.log(Object.keys(rowSize).length, Object.keys(columnDefs).length);

    Object.keys(rowSize).forEach((key) => {
        const { index, row } = rowSize[key];

        groupRows.forEach((groupRow) => {
            row[groupRow.field as string] = data[index][groupRow.field as keyof Row];
        });

        rows.push(row);
    });

    return [rows, Object.values(columnDefs)];
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

