import { AggregationType, Column, ColumnDef, Data, Row } from '../common';
import { v4 as uuidv4 } from 'uuid';

export const acumData = (
    data: Row,
    row: Row,
    columns: Column[],
    calculatedColumns: Column[],
    columnDefs: Record<string, ColumnDef>
): Row => {
    let lastColumn: ColumnDef;

    columns.forEach((column, index) => {
        const key = row[column.field as keyof Row] as string;
        const isLastColumn = index === columns.length - 1;
        let field = `${column.field}:${key || ''}`;

        if (lastColumn) {
            field = `${field}@${lastColumn.field}`;
        }

        if (column.field !== 'total:') {
            if (!columnDefs[field]) {
                columnDefs[field] = {
                    id: uuidv4(),
                    headerName: key,
                    field,
                    flex: 1,
                    children: [],
                    childrenMap: {},
                    _firstLevel: !index,
                };
            }

            if (lastColumn && !lastColumn.childrenMap?.[field]) {
                if (lastColumn.childrenMap) {
                    lastColumn.childrenMap[field] = columnDefs[field].id as string;
                }
                lastColumn.children?.push(columnDefs[field]);
            }

            lastColumn = columnDefs[field];
        }

        if (isLastColumn) {
            calculatedColumns.forEach((calculatedColumn) => {
                const valueField = `${calculatedColumn.field}@${field}`;

                if (calculatedColumn.aggregation === AggregationType.SUM) {
                    data[valueField] = +(data[valueField] || 0) + +(row[calculatedColumn.field as keyof Row] || 0);
                    data[calculatedColumn.field as keyof Row] =
                        +(data[calculatedColumn.field as keyof Row] || 0) +
                        +(row[calculatedColumn.field as keyof Row] || 0);

                    field
                        .split('@')
                        .slice(1)
                        .forEach((f) => {
                            const vField = `${calculatedColumn.field}@${f}`;
                            data[vField] = +(data[vField] || 0) + +(row[calculatedColumn.field as keyof Row] || 0);
                        });
                }

                if (lastColumn && !lastColumn.childrenMap?.[valueField]) {
                    const newValueColumn = {
                        ...calculatedColumn,
                        id: uuidv4(),
                        headerName: `${calculatedColumn.aggregation} of ${calculatedColumn.headerName}`,
                        pivotField: valueField,
                        field,
                        flex: 1,
                        _firstLevel: false,
                        children: [],
                    };

                    if (lastColumn.childrenMap) {
                        lastColumn.childrenMap[valueField] = newValueColumn.id;
                    }

                    lastColumn.children?.push(newValueColumn);
                }
            });
        }

        data[column.field as string] = key;
    });

    return data;
};

const newRow = (showTotals: boolean): Row => ({
    _id: uuidv4(),
    _expanded: true,
    _singleChild: !showTotals,
    children: [],
    childrenMap: {}
});

const addData = (
    row: Row & { childrenMap?: Record<string, number> },
    data: Row,
    aggregationColumns: Column[],
    currentLevel: number,
    columns: Column[],
    values: Column[],
    columnDefs: Record<string, ColumnDef>,
    showRowTotals: boolean
): Row => {
    const aggregationColumn = aggregationColumns[currentLevel];
    const isLastRowLevel = currentLevel === aggregationColumns.length - 1;
    const key = data[aggregationColumn.field as keyof Row] as string;

    if (!isLastRowLevel && showRowTotals) {
        const nextLevel = currentLevel + 1;
        const nextField = aggregationColumns[nextLevel]?.field as string;
        const nextKey = data[nextField as keyof Row] as string;

        if (!row.children) {
            row.children = [];
        }

        if(!row.childrenMap) {
            row.childrenMap = {};
        }

        let childIndex = row.childrenMap?.[nextKey] as number;

        if (!childIndex) {
            row.children?.push(newRow(showRowTotals));
            childIndex = (row.children?.length as number) - 1;
            row.childrenMap[nextKey] = childIndex;
        }

        addData(row.children[childIndex], data, aggregationColumns, nextLevel, columns, values, columnDefs, showRowTotals);
    }

    if (!showRowTotals) {
        aggregationColumns.forEach((column) => {
            row[column.field as string] = data[column.field as keyof Row];
        })
    } else {
        row[aggregationColumn.field as string] = key;
    }

    acumData(row, data, columns, values, columnDefs);

    return row;
};

export const groupByPivot = (
    data: Data,
    groupRows: Column[],
    columns: Column[],
    calculatedColumns: Column[],
    showRowTotals: boolean
): [Row[], ColumnDef[]] => {
    const rows: Row[] = [];
    const groups: Record<string, number> = {};
    const columnDefs: Record<string, ColumnDef> = {};

    data.forEach((row) => {
        const key = showRowTotals
            ? (row[groupRows[0].field as keyof Row] as string)
            : (groupRows.map((groupRow) => row[groupRow.field as keyof Row]).join('-') as string);

        if (groups[key] == null) {
            groups[key] = rows.length;
            rows.push(newRow(showRowTotals));
        }

        addData(rows[groups[key]], row, groupRows, 0, columns, calculatedColumns, columnDefs, showRowTotals);
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
    if (level === columns.length) {
        return [data, []];
    }
    return groupByPivot(data, columns, aggColumns, valueColumns, showRowTotals);
};
