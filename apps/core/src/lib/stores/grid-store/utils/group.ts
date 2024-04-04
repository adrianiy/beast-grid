import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnStore, TreeConstructor, MIN_COL_WIDTH, PinType, Row, ColumnDef, Data } from '../../../common';
import { changePosition } from './edition';
import { getAggregationType, groupBy } from '../../../utils/functions';

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

export const getValueHeaders = (group: Row, values: Column[], parentField = ''): ColumnDef[] => {
    const columnDefs: ColumnDef[] = [];
    values.forEach((val) => {
        const aggregation = getAggregationType(val, group);

        columnDefs.push({
            headerName: `${aggregation} of ${val.headerName}`,
            field: `${val.field}@${parentField}`,
            flex: 1,
            aggregation,
        });
    });

    return columnDefs;
};
export const getDynamicHeaders = (columnIdx: number, data: Data, columns: Column[], values: Column[], parentField = ''): ColumnDef[] => {
    if (!columns || columnIdx >= columns.length || !data.length) {
        return [];
    }
    const column = columns[columnIdx];
    const isLastColumn = columnIdx === columns.length - 1;
    const withValues = values.length > 0;

    const groupedData = groupBy(data, column, values || []);
    const columnDefs: ColumnDef[] = [];

    groupedData.forEach((group) => {
        const field = `${column.field}:${group[column.field as string]}${parentField}`;

        columnDefs.push({
            headerName: group[column.field as string] as string,
            field,
            flex: 1,
            minWidth: MIN_COL_WIDTH,
            children: isLastColumn && withValues
                ? getValueHeaders(group, values, field)
                : getDynamicHeaders(columnIdx + 1, group.children || [], columns, values, '&'+field),
        });
    });

    return columnDefs;
};
