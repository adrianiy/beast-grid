import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnStore, TreeConstructor, MIN_COL_WIDTH, PinType } from '../../../common';
import { changePosition } from './edition';

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
