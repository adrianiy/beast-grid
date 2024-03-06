import { v4 as uuidv4 } from 'uuid';
import { Column, ColumnStore, TreeConstructor, MIN_COL_WIDTH, PinType } from '../../../common';
import { changePosition, toggleHide } from './edition';
import { setColumnsStyleProps } from './initialization';

export const createGroupColumn = (column: Column, columns: ColumnStore, container: HTMLDivElement, tree?: Partial<TreeConstructor>) => {
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
        level: 0,
        final: true,
        menu: {
          ...tree.menu,
          column: true
        },
        width: tree.width || MIN_COL_WIDTH,
      };
      columns[newColumn.id] = newColumn;
      changePosition(columns, newColumn, [newColumn.id], 1);
    }

    if (!tree.showOriginal) {
      toggleHide(column, columns);
      setColumnsStyleProps(columns, container.offsetWidth);
    }
  }

  return newColumn;
};
