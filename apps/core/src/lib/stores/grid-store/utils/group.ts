import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnStore, TreeConstructor, MIN_COL_WIDTH, PinType, ColumnDef, Data } from '../../../common';
import { changePosition } from './edition';

export const createGroupColumn = (column: Column, columns: ColumnStore, tree?: Partial<TreeConstructor>) => {
    let newColumn = column;
    if (tree) {
        const treeColumn = Object.values(columns).find((col) => col.tree);

        if (!treeColumn) {
            newColumn = {
                headerName: tree.name || '',
                tree: true,
                field: tree.field as string,
                id: uuidv4(),
                pinned: PinType.NONE,
                top: 0,
                left: 0,
                position: 0,
                finalPosition: 0,
                level: 0,
                final: true,
                menu: {
                    ...tree.menu,
                    column: true,
                },
                width: tree.width || MIN_COL_WIDTH,
            };
            columns[newColumn.id] = newColumn;
            changePosition(columns, newColumn, [newColumn.id], 1);
        } else {
            newColumn = treeColumn;
        }
    }

    return newColumn;
};

export const getValueHeaders = (values: Column[]): ColumnDef[] => {
    const columnDefs: ColumnDef[] = [];
    values.forEach((val) => {
        columnDefs.push({
            ...val,
            id: uuidv4(),
            headerName: val.headerName,
            field: val.field,
            flex: 1,
        });
    });

    return columnDefs;
};
export const getDynamicHeaders = (
    columns: Column[],
    currentColumn: number,
    values: Column[],
    data: Data
): ColumnDef[] => {
    const groups: Record<string, boolean> = {};
    const columnDefs: ColumnDef[] = [];
    const column = columns[currentColumn];
    const isFinal = currentColumn === columns.length - 1;

    data.forEach((row) => {
        if (row[column.field as string] == null) return;

        const value = row[column.field as string] as string;
        const field = `${column.field}:${value}`;
        if (groups[field] == null) {
            groups[field] = true;
            columnDefs.push({
                headerName: value,
                field,
                flex: 1,
                minWidth: MIN_COL_WIDTH,
                children: isFinal && values.length > 0 ? getValueHeaders(values) : !isFinal ? getDynamicHeaders(columns, currentColumn + 1, values, data) : []
            });
        }
    });

    return columnDefs;
};
