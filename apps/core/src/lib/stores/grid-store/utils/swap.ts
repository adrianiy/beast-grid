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
    parent.childrenId = parent.childrenId?.filter((child) => child !== (column.original || column.id));
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

const _getChildrenPath = (column: Column, columns: ColumnStore): Column[] => {
    if (!column.childrenId) {
        return [column];
    }

    return [column, ...column.childrenId.map((child) => _getChildrenPath(columns[child], columns)).flat()];
}

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

const _getParentLengths = (column: Column, breakNode: Column, columns: ColumnStore): number[] => {
    const length = column.childrenId?.length || 0;

    if (!column.parent || column.id === breakNode.id) {
        return [length];
    }

    return [length, ..._getParentLengths(columns[column.parent as string], breakNode, columns)];
}

const _countMaxParentsChildren = (column1: Column, column2: Column, breakNode1: Column, breakNode2: Column, columns: ColumnStore): [number, number] => {
    const colun1Lengths = _getParentLengths(column1, breakNode1, columns);
    const colun2Lengths = _getParentLengths(column2, breakNode2, columns);

    return [Math.max(...colun1Lengths), Math.max(...colun2Lengths)];
}

export const getSwappableClone = (column1: Column, column2: Column, columns: ColumnStore): [Column, Column] => {
    const ltr = column1.left < column2.left;
    const [diffColumn1, diffColumn2] = _getFirstDifferentColumn(column1, column2, columns);
    const [breakNode1, breakNode2] = _getLastDifferentColumn(column1, column2, columns);
    const [children1, children2] = _countMaxParentsChildren(column1, column2, breakNode1, breakNode2, columns);

    console.log(
        JSON.parse(JSON.stringify(diffColumn1)),
        JSON.parse(JSON.stringify(diffColumn2)),
        JSON.parse(JSON.stringify(breakNode1)),
        children1,
        children2
    )

    let [swappable1, swappable2]: [Column | undefined, Column | undefined] = [undefined, undefined];

    if (children1 > 1) {
        swappable1 = _cloneColumn(column1, columns, breakNode1.id);
        const path = _getChildrenPath(breakNode1, columns);
        console.log(path)
        changePosition(columns, swappable1, !ltr ? path.map(c => c.id) : [swappable1.id], 1);
    } else if (children1 === 1) {
        swappable1 = breakNode1
    } else {
        swappable1 = diffColumn1;
    }
    if (children2 > 1) {
        swappable2 = _cloneColumn(column2, columns, breakNode2.id);
        const path = _getChildrenPath(breakNode2, columns);
        console.log(path)
        changePosition(columns, swappable2, !ltr ? path.map(c => c.id) : [swappable2.id], 1);
    } else if (children2 === 1) {
        swappable2 = breakNode2;
    } else {
        swappable2 = diffColumn2;
    }

    console.log(
        JSON.parse(JSON.stringify(swappable1)),
        JSON.parse(JSON.stringify(swappable2)),
    )

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
