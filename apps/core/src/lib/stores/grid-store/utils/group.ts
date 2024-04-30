import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnStore, TreeConstructor, MIN_COL_WIDTH, PinType, ColumnDef, Data } from '../../../common';
import { changePosition } from './edition';
import { groupBy } from '../../../utils/functions';

export const createGroupColumn = (column: Column, columns: ColumnStore, tree?: Partial<TreeConstructor>) => {
    let newColumn = column;
    if (tree) {
        const treeColumn = Object.values(columns).find((col) => col.tree);

        if (!treeColumn) {
            newColumn = {
                headerName: tree.name || '',
                tree: true,
                field: tree.field,
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

export const getValueHeaders = (values: Column[], parentField = ''): ColumnDef[] => {
    const columnDefs: ColumnDef[] = [];
    values.forEach((val) => {
        const aggregation = val.aggregation;

        columnDefs.push({
            headerName: `${aggregation} of ${val.headerName}`,
            pivotField: `${val.field}@${parentField}`,
            field: val.field,
            flex: 1,
            aggregation,
        });
    });

    return columnDefs;
};
export const getDynamicHeaders = (columns: Column[], values: Column[], data: Data): ColumnDef[] => {
    const groups: Record<string, boolean> = {};
    const columnDefs: ColumnDef[] = [];

    data.forEach((row) => {
        columns.forEach((column) => {
            if (!row[column.field as string]) {
                return;
            }
            const field = `${column.field}:${row[column.field as string]}`;
            if (!groups[field]) {
                groups[field] = true;
                columnDefs.push({
                    headerName: row[column.field as string] as string,
                    field,
                    flex: 1,
                    minWidth: MIN_COL_WIDTH,
                    children: values.length > 0 ? getValueHeaders(values, field) : [],
                });
            }
        })
    })

    return columnDefs;
    // if (!columns || columnIdx >= columns.length || !data.length) {
    //     return [];
    // }
    // const column = columns[columnIdx];
    // const isLastColumn = columnIdx === columns.length - 1;
    // const withValues = values.length > 0;
    //
    // console.log(column, values);
    // const groupedData = groupBy(data, column, values || []);
    // const columnDefs: ColumnDef[] = [];
    //
    // groupedData.forEach((group) => {
    //     const field = `${column.field}:${group[column.field as string]}${parentField}`;
    //
    //     columnDefs.push({
    //         headerName: group[column.field as string] as string,
    //         field,
    //         flex: 1,
    //         minWidth: MIN_COL_WIDTH,
    //         children: isLastColumn && withValues
    //             ? getValueHeaders(values, field)
    //             : getDynamicHeaders(columnIdx + 1, group.children || [], columns, values, '&'+field),
    //     });
    // });
    //
    // return columnDefs;
};
