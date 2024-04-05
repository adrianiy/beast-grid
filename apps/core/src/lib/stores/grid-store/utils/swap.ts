import { v4 as uuidv4 } from 'uuid';
import { ColumnStore, Column, ColumnId } from '../../../common';
import { changePosition } from './edition';

const _changeCloneStyles = (column: Column, parent: Column, destiny: Column, columns: ColumnStore) => {
    parent.width = parent.childrenId?.reduce((acc, child) => acc + columns[child].width, 0) || 0;
    destiny.width = column.width;
};
const _getParentClone = (column: Column, columns: ColumnStore): Column => {
    if (!column.parent) {
        return column;
    }
    const id = uuidv4();
    const parent = columns[column.parent];
    const parentClone = { ...parent, id, original: column.originalParent || column.parent, childrenId: [column.id] };
    column.originalParent = parent.original;
    column.parent = id;
    column.position = 0;
    parent.childrenId = parent.childrenId?.filter((child) => child !== column.id);
    _changeCloneStyles(column, parent, parentClone, columns);

    columns[id] = parentClone;

    return _getParentClone(parentClone, columns);
};

const _cloneColumn = (column: Column, columns: ColumnStore): Column => {
    const parentClone = _getParentClone(column, columns);

    columns[parentClone.id] = parentClone;

    return parentClone;
};

const _getParents = (column: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    if (column.parent === column2.parent) {
        return [column, column2];
    }
    let continueLoop = false;
    if (column.parent) {
        column = columns[column.parent];
        continueLoop = true;
    }
    if (column2.parent) {
        column2 = columns[column2.parent];
        continueLoop = true;
    }

    if (continueLoop) {
        return _getParents(column, column2, columns);
    } else {
        return [column, column2];
    }
};


export const getSwappableClone = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    const ltr = column1.left < column2.left;
    const [parent1, parent2] = _getParents(column1, column2, columns);


    let swappable1 =
        columns[column1.parent as ColumnId]?.childrenId?.length === 1 ? parent1 : column1.parent ? undefined : column1;
    let swappable2 =
        columns[column2.parent as ColumnId]?.childrenId?.length === 1 ? parent2 : column2.parent ? undefined : column2;


    if (!swappable1 || !swappable2) {
        if (!swappable1) {
            swappable1 = _cloneColumn(column1, columns);
            changePosition(columns, swappable1, [ltr ? parent1.id : swappable1.id], 1);
        }
        if (!swappable2) {
            swappable2 = _cloneColumn(column2, columns);
            changePosition(columns, swappable2, [ltr ? swappable2.id : parent2.id], 1);
        }
    }

    return [swappable1, swappable2];
};

export const swapPositions = (column1: Column, column2: Column) => {
    // change positions
    const position = column2.position;
    column2.position = column1.position;
    column1.position = position;
};
