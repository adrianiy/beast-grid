import { ColumnStore, Column, SortType, ColumnId, PinType, OnChanges, ChangeType } from '../../../common';
import { clone } from '../../../utils/functions';
import { DynamicState, GridStore } from '../store';

export const toggleHide = (column: Column, columns: ColumnStore) => {
    column.hidden = !column.hidden;

    if (column.childrenId) {
        column.childrenId.forEach((child) => {
            columns[child].hidden = column.hidden;
        });
    }
    if (column.parent) {
        const parent = columns[column.parent];
        const allChildrenHidden = parent.childrenId?.every((child) => columns[child].hidden);
        parent.hidden = allChildrenHidden;
    }
};

const _updateParent = (parent: Column, columns: ColumnStore) => {
    parent.width = 0;
    parent.childrenId?.forEach((id, idx) => {
        columns[id].position = idx;
        columns[id].parent = parent.id;
        columns[id].originalParent = parent.original;
        parent.width += columns[id].width;
    });
};
const _mergeIn = (main: Column, column: Column, columns: ColumnStore) => {
    main.childrenId?.push(...(column.childrenId || []).filter((id) => columns[id]));
    if (columns[column.parent as string]) {
        columns[column.parent as string].childrenId = columns[column.parent as string]?.childrenId?.map((id) =>
            id === column.id ? main.id : id
        );
    }
    _updateParent(main, columns);
};
const _mergeTo = (main: Column, column: Column, columns: ColumnStore) => {
    main.childrenId = [...(column.childrenId || []).filter((id) => columns[id]), ...(main.childrenId || [])];
    if (columns[column.parent as string]) {
        columns[column.parent as string].childrenId = columns[column.parent as string]?.childrenId?.map((id) =>
            id === column.id ? main.id : id
        );
    }

    _updateParent(main, columns);
};

export const changePosition = (columns: ColumnStore, pivot: Column, ignoreIds: ColumnId[], increase: number) => {
    Object.values(columns).forEach((column) => {
        if (column.position >= pivot.position && !ignoreIds.includes(column.id)) {
            column.position += increase;
            column.finalPosition += increase;
        }
    });
};

export const mergeColumns = (columns: ColumnStore) => {
    const sortedColumns = Object.values(columns)
        .sort(
            (a, b) =>
                a.level - b.level ||
                columns[a.parent as string]?.position - columns[b.parent as string]?.position ||
                a.position - b.position ||
                a.left - b.left
        )
        .filter((column) => (column.final && !column.parent) || column.childrenId);

    let lastColumn: Column = sortedColumns[0];
    let position = 0;

    for (const column of sortedColumns.slice(1)) {
        columns[column.id].position = ++position;
        if (lastColumn.id === column.original) {
            _mergeIn(lastColumn, column, columns);
            changePosition(columns, lastColumn, [lastColumn.id], -1);
            delete columns[column.id];
            position--;
        }
        if (lastColumn.original === column.id) {
            _mergeTo(column, lastColumn, columns);
            column.position = lastColumn.position;
            delete columns[lastColumn.id];
            position--;
        }
        if (lastColumn.original && lastColumn.original === column.original) {
            _mergeIn(lastColumn, column, columns);
            changePosition(columns, lastColumn, [lastColumn.id], -1);
            delete columns[column.id];
            position--;
        }
        lastColumn = column;
    }
};

const _moveColumns = (columns: Column[], columnStore: ColumnStore, left = 0) => {
    columns.forEach((column) => {
        if (!column || column.hidden) {
            return;
        }
        column.left = left;
        left += column.width || 150;

        if (column.childrenId) {
            const sortedChildren = column.childrenId.sort((a, b) => columnStore[a].position - columnStore[b].position);
            _moveColumns(
                sortedChildren.map((id) => columnStore[id]),
                columnStore,
                column.left
            );
        }
    });
};

export const moveColumns = (columns: ColumnStore, sortedColumns: Column[], pinType: PinType) => {
    const levelZero = sortedColumns.filter((column) => column.level === 0 && column.pinned === pinType);

    _moveColumns(levelZero, columns, 0);
};

export const resizeColumnChildren = (column: Column, diff: number, columns: ColumnStore) => {
    columns[column.id].width = (columns[column.id].width || 0) + diff

    if (column.childrenId) {
        column.childrenId?.forEach((child) => resizeColumnChildren(columns[child], diff, columns));
    }
};

export const resizeColumnParent = (column: Column, diff: number, columns: ColumnStore) => {
    columns[column.id].width += diff;

    if (column.parent) {
        resizeColumnParent(columns[column.parent], diff, columns);
    }
}

const PIN_ORDER = { [PinType.LEFT]: 0, [PinType.NONE]: 1, [PinType.RIGHT]: 2 };

export const setFinalPosition = (columnIds: ColumnId[], columns: ColumnStore, finalPosition = 0) => {
    columnIds.forEach((columnId) => {
        const column = columns[columnId];

        if (!column) {
            return;
        }

        if (column.childrenId) {
            finalPosition = setFinalPosition(column.childrenId as ColumnId[], columns, finalPosition);
        } else {
            column.finalPosition = finalPosition;
            finalPosition++;
        }
    });

    return finalPosition;
};

export const sortColumns = (
    columns: ColumnStore,
    onChanges?: OnChanges
) => {
    const sortedColumns = Object.values(columns).sort(
        (a, b) =>
            PIN_ORDER[a.pinned] - PIN_ORDER[b.pinned] ||
            a.level - b.level ||
            columns[a.parent as string]?.position - columns[b.parent as string]?.position ||
            a.position - b.position ||
            a.left - b.left
    );

    setFinalPosition(
        sortedColumns.filter((c) => c.level === 0).map((c) => c.id),
        columns
    );

    onChanges?.(ChangeType.SWAP, { columns, sortedColumns });

    return sortedColumns;
};

export const addSort = (
    column: Column,
    columnsWithSort: Column[],
    multipleColumnSort: boolean,
    order: SortType = SortType.ASC,
    temporal?: boolean
) => {
    if (multipleColumnSort) {
        const lastPriority = columnsWithSort.reduce((acc, col) => Math.max(acc, col.sort?.priority as number || 0), 0);

        column.sort = {
            order,
            priority: lastPriority + 1,
            temporal
        };
    } else {
        column.sort = {
            order,
            priority: 1,
            temporal
        };

        if (columnsWithSort.length > 0) {
            delete columnsWithSort[0].sort;
        }
    }
};

export const removeSort = (column: Column, columnsWithSort: Column[]) => {
    columnsWithSort.forEach((col) => {
        if (col.sort && (col.sort?.priority || 0) > (column.sort?.priority || 0)) {
            col.sort.priority -= 1;
        }
    });
    delete column.sort;
};

export const updateColumnVisibility = (
    scrollElement: HTMLElement,
    scrollLeft: number,
    columns: ColumnStore
): ColumnStore => {
    const scrollWidth = scrollElement?.clientWidth || 0;

    const threshold = scrollWidth * 0.3;

    Object.keys(columns).forEach((columnId) => {
        const column = columns[columnId];

        if (column.pinned === PinType.NONE) {
            const left = column.left;
            const right = column.left + column.width;
            const leftEdge = scrollLeft - threshold * 2;
            const rightEdge = scrollLeft + scrollWidth + threshold;

            const leftVisible = left > leftEdge && left < rightEdge;
            const rightVisible = right < rightEdge && right > leftEdge;
            const allVisible = leftVisible && rightVisible;
            const onlyInsideVisible = left < leftEdge && right > rightEdge;
            column.inView = leftVisible || rightVisible || allVisible || onlyInsideVisible;
        }
    });

    return columns;
};

export const saveSnapshot = (state: GridStore): [DynamicState[], number] => {
    const {
        snapshots,
        columns,
        sort,
        groupOrder,
        sortedColumns,
        hiddenColumns,
        filters,
        pivotData,
        pivot,
        groupData,
        historyPoint
    } = state;

    if (historyPoint < snapshots.length - 1) {
        snapshots.splice(historyPoint + 1);
    }

    const newHistoryPoint = historyPoint + 1;

    const newSnapshot: DynamicState = clone({
        columns,
        sort,
        groupOrder,
        sortedColumns,
        hiddenColumns,
        pivot,
        filters,
        historyPoint: newHistoryPoint
    });

    if (!pivotData?.length) {
        newSnapshot.pivotData = pivotData;
    }

    if (!groupData?.length) {
        newSnapshot.groupData = groupData;
    }

    snapshots.push(newSnapshot);

    return [snapshots, newHistoryPoint];
}

export const updateSnapshotAndSetState = (state: GridStore, newState: Partial<GridStore>): Partial<GridStore> => {
    const [snapshots, historyPoint] = saveSnapshot({ ...state, ...newState });

    newState.snapshots = snapshots;
    newState.historyPoint = historyPoint;

    return newState;
}
