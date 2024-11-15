/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { Column, ColumnId, IFilter } from './../../common/interfaces';
import { MIN_COL_WIDTH } from './../../common/globals';
import { v4 as uuidv4 } from 'uuid';

import {
    addSort,
    changePosition,
    createVirtualIds,
    getColumnsFromDefs,
    getSwappableClone,
    groupDataByColumnDefs,
    initialize,
    mergeColumns,
    moveColumns,
    removeSort,
    resizeColumnChildren,
    resizeColumnParent,
    saveSnapshot,
    setColumnFilters,
    setColumnsStyleProps,
    sortColumns,
    swapPositions,
    toggleHide,
    updateColumnVisibility,
    updateSnapshotAndSetState,
} from './utils';
import { GridState, GridStore } from './store';
import {
    ChangeType,
    ColumnDef,
    Coords,
    Data,
    FilterType,
    PinType,
    PivotConfig,
    SelectedCells,
    SideBarConfig,
    SortType,
} from '../../common';
import { createGroupColumn, getValueHeaders } from './utils/group';
import { clone, filterRow, getSumatoryColumns } from '../../utils/functions';
import { groupPivot } from '../../utils/pivot';

export const setColumn = (id: ColumnId, column: Column) => (state: GridStore) => {
    const { columns } = state;
    columns[id] = column;

    return { columns, edited: true };
};

export const resetColumnConfig = (id: ColumnId) => (state: GridStore) => {
    const { columns } = state;
    const column = columns[id];
    column.sort = undefined;

    const columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

    return { columns, sort: columnsWithSort.map((col) => col.id), edited: true };
};

export const hideColumn = (id: ColumnId) => (state: GridStore) => {
    const { columns, hiddenColumns, sortedColumns, container, onChanges } = state;

    const column = columns[id];

    if (column) {
        toggleHide(column, columns);

        setColumnsStyleProps(columns, container.offsetWidth);
        moveColumns(columns, sortedColumns, column.pinned);
    }

    if (hiddenColumns.includes(id)) {
        hiddenColumns.splice(hiddenColumns.indexOf(id), 1);
    } else {
        hiddenColumns.push(id);
    }

    if (onChanges) {
        onChanges(ChangeType.VISIBILITY, { hiddenColumns: hiddenColumns.map((id) => columns[id]).filter(Boolean) });
    }

    return { columns, hiddenColumns, haveChanges: true }
};

export const swapColumns = (id1: ColumnId, id2: ColumnId) => (state: GridStore) => {
    const { columns, onChanges } = state;
    let { sortedColumns } = state;
    let column1 = columns[id1];
    let column2 = columns[id2];

    if (!column1 || !column2) {
        return state;
    }

    if (column1.parent !== column2.parent) {
        [column1, column2] = getSwappableClone(column1, column2, columns);
    }

    // change positions
    swapPositions(column1, column2);
    mergeColumns(columns);

    sortedColumns = sortColumns(columns, onChanges);

    moveColumns(columns, sortedColumns, column1.pinned);

    return { columns, sortedColumns, haveChanges: true };
};

export const deleteEmptyParents = () => (state: GridStore) => {
    const { columns } = state;

    Object.values(columns).forEach((column) => {
        if (column.logicDelete) {
            delete columns[column.id];
        }
    });

    return { columns, edited: true };
};

export const resizeColumn = (id: ColumnId, width: number) => (state: GridStore) => {
    const { columns, sortedColumns } = state;
    const column = columns[id];

    const prevWidth = column.width;

    column.width = Math.max(width, column.minWidth || 25);
    column.flex = undefined;

    if (column.parent) {
        const diff = column.width - prevWidth;
        resizeColumnParent(columns[column.parent], diff, columns);
    }
    if (column.childrenId) {
        const diff = (column.width - prevWidth) / column.childrenId.length;
        column.childrenId?.forEach((child) => {
            resizeColumnChildren(columns[child], diff, columns);
        });
    }

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);

    return { columns, edited: true };
};

// Changes the sort tye of a column
export const changeSort = (id: ColumnId, multipleColumnSort: boolean, sortType?: SortType) => (state: GridStore) => {
    const { columns, onChanges } = state;

    let columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

    const sortedColumns = columnsWithSort.sort((a, b) => a.sort!.priority - b.sort!.priority);
    const column = columns[id];

    if (!column.sort) {
        addSort(column, sortedColumns, multipleColumnSort, sortType);
    } else if (sortType === column.sort?.order) {
        removeSort(column, sortedColumns);
    } else if (column.sort?.order === SortType.ASC || sortType) {
        column.sort.order = sortType || SortType.DESC;
    } else {
        removeSort(column, sortedColumns);
    }

    columnsWithSort = Object.values(columns).filter((col) => col.sort?.priority);

    if (onChanges) {
        onChanges(ChangeType.SORT, { sortColumns: columnsWithSort });
    }

    const newState = { columns, sort: columnsWithSort.map((col) => col.id) } as GridStore;

    return updateSnapshotAndSetState(state, newState);
};

export const addFilter =
    (id: ColumnId, value: IFilter | null, idx = 0) =>
        (state: GridStore) => {
            const { columns, filters, data } = state;
            const column = columns[id];

            if (column.filterType === FilterType.TEXT) {
                if (filters[id]?.includes(value as string)) {
                    filters[id] = filters[id]?.filter((val) => val !== value);
                } else {
                    filters[id] = filters[id] ? [...filters[id], value as string] : [value as string];
                }
            }
            if (column.filterType === FilterType.NUMBER) {
                if (!filters[id]) {
                    filters[id] = [];
                }
                if (!value) {
                    if (!idx) {
                        filters[id] = [];
                    } else {
                        filters[id] = filters[id]?.filter((_, i) => i !== idx);
                    }
                } else if (filters[id][idx]) {
                    filters[id][idx] = value;
                } else {
                    filters[id][idx] = value;
                }
            }
            if (column.filterType === FilterType.BOOLEAN) {
                if (filters[id]?.includes(value as string)) {
                    filters[id] = filters[id]?.filter((val) => val !== value);
                } else {
                    filters[id] = filters[id] ? [...filters[id], value as string] : [value as string];
                }
            }

            if (!filters[id].length) {
                delete filters[id];
            }

            const newData = data.map(filterRow(columns, filters)) as Data;

            const newState = { columns, filters: { ...filters }, data: newData, haveChanges: true } as GridStore;

            return updateSnapshotAndSetState(state, newState);
        };

export const selectAllFilters = (id: ColumnId, options: IFilter[]) => (state: GridStore) => {
    const { filters } = state;

    if (options.length === filters[id]?.length) {
        filters[id] = [];
    } else {
        filters[id] = options as string[];
    }

    const newState = { filters: { ...filters } } as GridStore;

    return updateSnapshotAndSetState(state, newState);
};

export const pinColumn = (id: ColumnId, pin: PinType) => (state: GridStore) => {
    const { columns, sortedColumns } = state;
    const column = columns[id];

    column.pinned = pin;

    if (column.childrenId) {
        column.childrenId.forEach((child) => {
            columns[child].pinned = pin;
        });
    }

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);
    moveColumns(columns, sortedColumns, PinType.RIGHT);

    const newState = { columns };

    return updateSnapshotAndSetState(state, newState);
};

export const groupByColumn = (id: ColumnId) => (state: GridStore) => {
    const { columns, tree, container, groupOrder, data, onChanges } = state;
    const column = columns[id];

    const newColumn = createGroupColumn(column, columns, tree);

    if (tree && !tree.showOriginal) {
        toggleHide(column, columns);
        setColumnsStyleProps(columns, container.offsetWidth);
    }

    newColumn.rowGroup = true;
    groupOrder.push(id);

    const groupData = groupDataByColumnDefs(columns, data, groupOrder);

    const sortedColumns = sortColumns(columns, onChanges);

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);
    moveColumns(columns, sortedColumns, PinType.RIGHT);

    const newState = { columns, groupOrder, groupData, sortedColumns, isGrouped: true };

    return updateSnapshotAndSetState(state, newState);
};

export const unGroupColumn = (id: ColumnId) => (state: GridStore) => {
    const { columns, container, data, onChanges } = state;
    let { groupOrder } = state;
    const column = columns[id];

    column.rowGroup = false;

    if (column.tree) {
        groupOrder.forEach((col) => {
            toggleHide(columns[col], columns);
            changePosition(columns, column, [column.id], -1);
        });
        groupOrder = [];
        setColumnsStyleProps(columns, container.offsetWidth);
        delete columns[column.id];
    } else {
        groupOrder = groupOrder.filter((col) => col !== id);
    }

    if (!groupOrder.length) {
        const newState = { columns, groupOrder, groupData: undefined, isGrouped: false }

        return updateSnapshotAndSetState(state, newState);
    }

    const groupData = groupDataByColumnDefs(columns, data, groupOrder);

    const sortedColumns = sortColumns(columns, onChanges);

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);
    moveColumns(columns, sortedColumns, PinType.RIGHT);

    const newState = { columns, groupOrder, groupData, sortedColumns, isGrouped: true };

    return updateSnapshotAndSetState(state, newState);
};

export const updateSelectedCells = (selectedCells: SelectedCells | null) => () => {
    return { selectedCells };
};

export const setSelectedStart = (coords: Coords) => () => {
    return { selectedCells: { start: coords, end: coords, init: coords } };
};

export const setSelectedEnd = (coords: Coords) => (state: GridStore) => {
    const { selectedCells } = state;

    if (!selectedCells) {
        return state;
    }

    return {
        selectedCells: {
            init: selectedCells.init,
            start: { x: Math.min(selectedCells.init.x, coords.x), y: Math.min(selectedCells.init.y, coords.y) },
            end: { x: Math.max(selectedCells.init.x, coords.x), y: Math.max(selectedCells.init.y, coords.y) },
        },
    };
};

export const autoSizeColumns = () => (state: GridStore) => {
    const { columns, container, sortedColumns } = state;

    setColumnsStyleProps(columns, container.offsetWidth);
    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);
    moveColumns(columns, sortedColumns, PinType.RIGHT);

    return { columns };
};

export const restore = (at = 0) => (state: GridStore) => {
    const { snapshots, scrollElement, onChanges } = state;

    if (!snapshots[at]) {
        return state;
    }

    const firstSnapshot = snapshots[at];

    if (onChanges) {
        onChanges(ChangeType.RESTORE, {});
    }

    if (!firstSnapshot.isPivoted) {
        firstSnapshot.pivotData = undefined;
    }
    if (!firstSnapshot.isGrouped) {
        firstSnapshot.groupData = undefined;
    }

    updateColumnVisibility(scrollElement, 0, firstSnapshot.columns);

    const [newSnapshots, historyPoint] = saveSnapshot({ ...state, ...firstSnapshot, snapshots: [], historyPoint: -1 });

    return { ...state, ...firstSnapshot, snapshots: newSnapshots, historyPoint, haveChanges: false };
};

export const clearHistory = () => (state: GridStore) => {
    const { snapshots } = state;

    if (!snapshots?.length) {
        return state;
    }

    snapshots.splice(snapshots.length - 1, 1);

    return { snapshots, historyPoint: -1 };
}

export const saveState = () => (state: GridStore) => {
    const { haveChanges } = state;

    if (haveChanges) {
        return updateSnapshotAndSetState(state, {});
    } else {
        return state;
    }
}

export const moveHistory = (direction: number) => (state: GridStore) => {
    const { snapshots, historyPoint, scrollElement } = state;
    const currentState = snapshots[historyPoint];
    const nextState = clone(snapshots[historyPoint + direction]);

    const newState = { ...state, ...nextState }

    if (nextState.isPivoted != currentState.isPivoted) {
        if (nextState.isPivoted) {
            newState.pivotData = setPivot(nextState.pivot)(newState).pivotData;
        } else {
            newState.pivotData = undefined;
        }
    }

    if (nextState.isGrouped != currentState.isGrouped) {
        if (nextState.isGrouped) {
            newState.groupData = groupDataByColumnDefs(newState.columns, state.data, newState.groupOrder);
        } else {
            newState.groupData = undefined;
        }
    }

    updateColumnVisibility(scrollElement, 0, newState.columns);

    return newState;
}

export const undo = () => (state: GridStore) => {
    const { snapshots } = state;

    if (snapshots.length === 1) {
        return state;
    }

    return moveHistory(-1)(state);
}

export const redo = () => (state: GridStore) => {
    const { snapshots, historyPoint } = state;

    if (historyPoint === snapshots.length - 1) {
        return state;
    }

    return moveHistory(1)(state);
}

export const setSideBarConfig = (config: SideBarConfig | null) => (state: GridStore) => {
    const { sideBarConfig } = state;

    if (sideBarConfig === config) {
        return { sideBarConfig: null };
    }

    return { sideBarConfig: config };
};

export const setInitialPivot = (pivotConfig: PivotConfig) => (state: GridStore) => {
    const { sortedColumns, pivot } = state;

    if (pivot) {
        return state;
    }

    const _columns = pivotConfig?.columns.map((columnField) =>
        sortedColumns.find((column) => column.field === columnField)
    ) as Column[];
    const rows = pivotConfig?.rows.map((rowField) =>
        sortedColumns.find((column) => column.field === rowField)
    ) as Column[];

    const values = pivotConfig?.values.map((valueField) => {
        const column = sortedColumns.find((column) => column.field === valueField.field);

        return {
            ...column,
            aggregation: valueField.operation,
        };
    }) as Column[];

    const pivotResult = setPivot({
        columns: _columns,
        rows,
        values,
    })({
        ...state,
        pivot: {
            columnTotals: pivotConfig.columnTotals,
            rowTotals: pivotConfig.rowTotals,
            rowGroups: pivotConfig.rowGroups,
        },
    } as GridStore);

    return pivotResult;
};

export const setPivot =
    (newPivot: Partial<GridState['pivot']> | null) => (state: GridStore) => {
        const { pivot: currentPivot, data: currentData, defaultColumnDef, snapshots, container, onChanges } = state;
        console.log(newPivot);
        const data = currentData.filter(row => !row._hidden) as Data;

        const nonEmptyPivot = Object.keys(newPivot || {}).length;

        const pivot = nonEmptyPivot ? { ...currentPivot, ...newPivot } : (newPivot || {});

        const snapshotBeforePivot = pivot.snapshotBeforePivot;

        if (pivot.rows?.length || pivot.columns?.length || pivot.values?.length) {
            const rowColumnDefs: ColumnDef[] = [];
            const columnDefs: ColumnDef[] = [];
            const groupOrder: ColumnId[] = [];

            if (pivot.rows?.length) {
                pivot.rows.forEach((row, index) => {
                    const column = {
                        id: uuidv4(),
                        headerName: row.headerName,
                        field: row.field,
                        width: MIN_COL_WIDTH,
                        rowGroup: index < (pivot.rows?.length || 0) - 1,
                        styleFormatter: row.styleFormatter,
                        headerStyleFormatter: row.headerStyleFormatter,
                        dateFormat: row.dateFormat,
                        tree: false,
                        final: true,
                        level: 0
                    } as Column;

                    rowColumnDefs.push(column);
                });
            }

            const columns = getColumnsFromDefs(rowColumnDefs, defaultColumnDef);

            if (pivot.rows?.length) {
                rowColumnDefs.forEach((row) => {
                    const column = columns[row.id as ColumnId];

                    groupOrder.push(column.id);
                });
            }

            const [groupedByRows, bottomRows, valueColumns] = groupPivot(
                pivot.rows || [],
                pivot.columns || [{ field: 'total' } as Column],
                pivot.values || [],
                data,
                !!pivot?.rowTotals
            );

            if (pivot.columns?.length) {
                if (pivot?.columnTotals) {
                    columnDefs.push(
                        ...getSumatoryColumns(
                            valueColumns.filter((c) => c._firstLevel),
                            pivot.values || []
                        )
                    );
                } else {
                    columnDefs.push(...valueColumns.filter((c) => c._firstLevel));
                }
            } else if (pivot.values?.length) {
                const valueHeaders = getValueHeaders(pivot.values);
                columnDefs.push(...valueHeaders);
            }

            const finalColumns = getColumnsFromDefs([...Object.values(columns), ...columnDefs], defaultColumnDef);

            setColumnsStyleProps(finalColumns, container.offsetWidth);
            setColumnFilters(finalColumns, data);

            const sortedColumns = sortColumns(finalColumns);
            const columnsWithSort: Column[] = [];

            rowColumnDefs.forEach(columnDef => {
                const column = finalColumns[columnDef.id as ColumnId];
                addSort(column, columnsWithSort, true, SortType.ASC, true);
                columnsWithSort.push(column);
            })

            moveColumns(finalColumns, sortedColumns, PinType.NONE);

            if (onChanges) {
                onChanges(ChangeType.PIVOT, { pivot });
            }

            const sort = columnsWithSort.map((col) => col.id);

            pivot.snapshotBeforePivot = snapshots.length - 1;

            const newState = { pivotData: groupedByRows, bottomRows, groupData: undefined, columns: finalColumns, sortedColumns, sort, groupOrder, pivot, filters: {}, snapshotBeforePivot, isPivoted: true, haveChanges: true };

            return newState;
        }

        if (onChanges) {
            onChanges(ChangeType.PIVOT, { pivot });
        }

        return restore(snapshotBeforePivot)(state);
    };

export const setColumnsVisibility = (scrollLeft: number) => (state: GridStore) => {
    const { columns, scrollElement } = state;

    updateColumnVisibility(scrollElement, scrollLeft, columns);

    return { columns };
};

export const setData = (_data: Data, pivot?: PivotConfig) => (state: GridStore) => {
    const { columns, groupOrder, tree, container } = state;
    const initialData = createVirtualIds(_data as Data);
    const [data, finalColumns] = initialize(columns, container, initialData, groupOrder, tree);

    if (pivot) {
        return setInitialPivot(pivot)({ ...state, data });
    }

    const newState = { data, columns: finalColumns, unfilteredData: [...data], initialized: true, snapshots: [], historyPoint: -1 };

    return updateSnapshotAndSetState(state, newState);
};

export const updateColumnDefs = (columnDefs: ColumnDef[], pivotConfig?: PivotConfig) => (state: GridStore) => {
    const { container, onChanges } = state;
    const newColumns = getColumnsFromDefs(columnDefs, state.defaultColumnDef);

    const sortedColumns = sortColumns(newColumns, onChanges);

    moveColumns(newColumns, sortedColumns, PinType.LEFT);
    moveColumns(newColumns, sortedColumns, PinType.NONE);
    moveColumns(newColumns, sortedColumns, PinType.RIGHT);

    setColumnsStyleProps(newColumns, container.offsetWidth);

    const hiddenColumns = sortedColumns.filter((col) => col.hidden).map((col) => col.id);

    if (pivotConfig) {
        return setInitialPivot(pivotConfig)({ ...state, columns: newColumns, sortedColumns, hiddenColumns, isPivoted: true });
    }

    return { columns: newColumns, sortedColumns, hiddenColumns, edited: true };
}
