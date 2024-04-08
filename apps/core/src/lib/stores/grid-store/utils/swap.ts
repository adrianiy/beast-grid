import { v4 as uuidv4 } from 'uuid';
import { ColumnStore, Column } from '../../../common';
import { changePosition } from './edition';

const _changeCloneStyles = (column: Column, parent: Column, destiny: Column, columns: ColumnStore) => {
    parent.width = parent.childrenId?.reduce((acc, child) => acc + columns[child].width, 0) || 0;
    destiny.width = column.width;
};
const _getParentClone = (column: Column, columns: ColumnStore, breakId: string): Column => {
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

    if (parent.id === breakId) {
        return parentClone;
    }

    return _getParentClone(parentClone, columns, breakId);
};

const _cloneColumn = (column: Column, columns: ColumnStore, breakId: string): Column => {
    const parentClone = _getParentClone(column, columns, breakId);

    columns[parentClone.id] = parentClone;

    return parentClone;
};

const _getFirstDifferentColumn = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    const sameParents = column1.parent === column2.parent;

    if (sameParents) {
        return _getFirstDifferentColumn(columns[column1.parent as string], columns[column2.parent as string], columns);
    }

    return [column1, column2];
};

const _getLastDifferentColumn = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    const sameParents = column1.parent === column2.parent;

    if (!sameParents) {
        return _getLastDifferentColumn(column1.parent ? columns[column1.parent as string] : column1, column2.parent ? columns[column2.parent as string] : column2, columns);
    }

    return [column1, column2];
}

const _getParentLengths = (column: Column, breakColumn: Column, columns: ColumnStore): number[] => {
    const length = column.childrenId?.length || 0;

    if (!column.parent || column.id === breakColumn.id) {
        return [length];
    }

    return [length, ..._getParentLengths(columns[column.parent as string], breakColumn, columns)];
}

const _countMaxParentsChildren = (column1: Column, column2: Column, breakColumn1: Column, breakColumn2: Column, columns: ColumnStore): [number, number] => {
    const colun1Lengths = _getParentLengths(column1, breakColumn1, columns);
    const colun2Lengths = _getParentLengths(column2, breakColumn2, columns);

    return [Math.max(...colun1Lengths), Math.max(...colun2Lengths)];
}

export const getSwappableClone = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    const ltr = column1.left < column2.left;
    const [diffColumn1, diffColumn2] = _getFirstDifferentColumn(column1, column2, columns);
    const [breakColumn1, breakColumn2] = _getLastDifferentColumn(column1, column2, columns);
    const [children1, children2] = _countMaxParentsChildren(column1, column2, breakColumn1, breakColumn2, columns);

    let [swappable1, swappable2]: [Column | undefined, Column | undefined] = [undefined, undefined];

    if (children1 > 1) {
        swappable1 = _cloneColumn(column1, columns, breakColumn1.id);
        changePosition(columns, swappable1, [ltr ? swappable1.original as string : diffColumn1.id], 1);
    } else if (children1 === 1) {
        swappable1 = columns[diffColumn1.parent as string]
    } else {
        swappable1 = diffColumn1;
    }
    if (children2 > 1) {
        swappable2 = _cloneColumn(column2, columns, breakColumn2.id);
        changePosition(columns, swappable2, [ltr ? diffColumn2.id : swappable2.id], 1);
    } else if (children2 === 1) {
        swappable2 = columns[diffColumn2.parent as string]
    } else {
        swappable2 = diffColumn2;
    }

    return [swappable1, swappable2];
};

export const swapPositions = (column1: Column, column2: Column) => {
    // change positions
    const position = column2.position;
    const finalPosition = column2.finalPosition;
    column2.position = column1.position;
    column2.finalPosition = column1.finalPosition;
    column1.position = position;
    column1.finalPosition = finalPosition;
};
