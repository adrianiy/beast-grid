import { StoreApi, create } from 'zustand';
import {
    addFilter,
    autoSizeColumns,
    changeSort,
    deleteEmptyParents,
    groupByColumn,
    hideColumn,
    pinColumn,
    resetColumnConfig,
    resizeColumn,
    restore,
    selectAllFilters,
    setColumn,
    setPivot,
    setPivotConfig,
    setSelectedEnd,
    setSelectedStart,
    setSideBarConfig,
    swapColumns,
    unGroupColumn,
    updateSelectedCells,
} from './actions';
import { Column, ColumnId, ColumnStore, Data, IFilter } from './../../common/interfaces';
import {
    BeastGridConfig,
    BeastMode,
    ColumnDef,
    Coords,
    PinType,
    SelectedCells,
    SideBarConfig,
    SortType,
    TreeConstructor,
} from '../../common';
import { createVirtualIds, getColumnsFromDefs, initialize, moveColumns, sortColumns } from './utils';
import { clone } from '../../utils/functions';

export interface PivotState {
    columns: Column[];
    rows: Column[];
    values: Column[];
    data: Data;
    enabled: boolean;
    columnTotals: boolean;
    rowTotals: boolean;
    rowGroups: boolean;
}

export interface GridState {
    edited: boolean;
    data: Data;
    columns: ColumnStore;
    theme: string;
    container: HTMLDivElement;
    defaultColumnDef: Partial<ColumnDef> | undefined;
    allowMultipleColumnSort: boolean;
    sort: ColumnId[];
    tree: Partial<TreeConstructor> | undefined;
    groupOrder: ColumnId[];
    initialData: Data;
    initialColumns: ColumnStore;
    sortedColumns: Column[];
    hiddenColumns: ColumnId[];
    loading: boolean;
    sorting: boolean;
    scrollElement: HTMLDivElement;
    filters: Record<ColumnId, IFilter[]>;
    sideBarConfig: SideBarConfig | null;
    selectedCells: SelectedCells | null;
    selecting: boolean;
    mode: BeastMode;
    pivot: Partial<PivotState> | null;
    onSwapChange?: (columns: ColumnStore, sortedColumns: Column[]) => void;
    onPivotChange?: (pivot: Partial<PivotState>) => void;
}

export interface GridStore extends GridState {
    setData: (data: Data) => void;
    setColumns: (columns: ColumnStore) => void;
    setTheme: (theme: string) => void;
    setScrollElement: (container: HTMLDivElement) => void;
    setColumn: (args: { id: string; column: Column }) => void;
    hideColumn: (id: ColumnId) => void;
    cleanColumns: () => void;
    swapColumns: (id1: ColumnId, id2: ColumnId) => void;
    resizeColumn: (id: ColumnId, width: number) => void;
    groupByColumn: (id: ColumnId) => void;
    unGroupColumn: (id: ColumnId) => void;
    resetColumnConfig: (id: ColumnId) => void;
    changeSort: (id: ColumnId, multipleColumnSort: boolean) => void;
    setSort: (sort: ColumnId, sortType: SortType, multipleColumnSort: boolean) => void;
    setLoading: (loading: boolean) => void;
    setSorting: (sorting: boolean) => void;
    addFilter: (id: ColumnId, value: IFilter | null, idx?: number) => void;
    selectAllFilters: (id: ColumnId, options: IFilter[]) => void;
    pinColumn: (id: ColumnId, pin: PinType) => void;
    setSideBarConfig: (config: SideBarConfig | null) => void;
    updateSelectedCells: (selected: SelectedCells | null) => void;
    setSelectedStart: (selected: Coords) => void;
    setSelectedEnd: (selected: Coords) => void;
    setSelecting: (selecting: boolean) => void;
    setMode: (mode: BeastMode) => void;
    setPivot: (pivot: Partial<PivotState> | null) => void;
    restore: () => void;
    autoSizeColumns: () => void;
}

export const createGridStore = <T>(
    { data: _data, columnDefs, defaultColumnDef, sort, tree, pivot }: BeastGridConfig<T>,
    container: HTMLDivElement,
    theme: string,
    onSwapChange?: (columns: ColumnStore, sortedColumns: Column[]) => void,
    onPivotChange?: (pivot: Partial<PivotState>) => void
) => {
    let columns = getColumnsFromDefs(columnDefs, defaultColumnDef);

    let groupOrder = Object.values(columns)
        .filter((col) => col.rowGroup)
        .map((col) => col.id);
    const initialData = createVirtualIds(_data as Data);

    let data = initialize(columns, container, initialData, groupOrder, tree);
    let sortedColumns = sortColumns(columns, onSwapChange);

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);

    if (pivot?.pivotConfig) {
        const _columns = pivot?.pivotConfig?.columns.map((columnField) =>
            sortedColumns.find((column) => column.field === columnField)
        ) as Column[];
        const rows = pivot?.pivotConfig?.rows.map((rowField) =>
            sortedColumns.find((column) => column.field === rowField)
        ) as Column[];
        const values = pivot?.pivotConfig?.values.map((valueField) =>
            sortedColumns.find((column) => column.field === valueField.field)
        ) as Column[];

        const pivotResult = setPivot({
            columns: _columns,
            rows,
            values,
        })({
            initialData: [...initialData],
            defaultColumnDef,
            pivot: {
                columnTotals: pivot.pivotConfig.columnTotals,
                rowTotals: pivot.pivotConfig.rowTotals,
                rowGroups: pivot.pivotConfig.rowGroups,
            },
        } as GridStore);

        if (pivotResult.columns) {
            columns = pivotResult.columns;
        }

        if (pivotResult.data) {
            data = pivotResult.data;
        }

        if (pivotResult.groupOrder) {
            groupOrder = pivotResult.groupOrder;
        }

        if (pivotResult.sortedColumns) {
            sortedColumns = pivotResult.sortedColumns;
        }
    }

    const initialState = {
        edited: false,
        defaultColumnDef,
        data,
        initialData: [...initialData],
        initialColumns: clone(columns),
        hiddenColumns: sortedColumns.filter((col) => col.hidden).map((col) => col.id),
        tree,
        groupOrder,
        columns,
        sortedColumns,
        allowMultipleColumnSort: !!sort?.multiple,
        theme,
        sort: [],
        selectedCells: null,
        filters: {},
        loading: false,
        sorting: false,
        selecting: false,
        pivot: null,
        pivotConfig: null,
        onSwapChange,
        onPivotChange,
    };

    return create<GridStore>((set) => ({
        ...initialState,
        container,
        mode: BeastMode.GRID,
        scrollElement: null as unknown as HTMLDivElement,
        sideBarConfig: null,
        setData: (data: Data) => set({ data }),
        setColumns: (columns: ColumnStore) => set({ columns }),
        setTheme: (theme: string) => set({ theme }),
        setScrollElement: (scrollElement: HTMLDivElement) => set({ scrollElement }),
        setColumn: (payload) => set(setColumn(payload.id, payload.column)),
        hideColumn: (id: ColumnId) => set(hideColumn(id)),
        cleanColumns: () => set(deleteEmptyParents()),
        swapColumns: (id1: ColumnId, id2: ColumnId) => set(swapColumns(id1, id2)),
        resizeColumn: (id: ColumnId, width: number) => set(resizeColumn(id, width)),
        groupByColumn: (id: ColumnId) => set(groupByColumn(id)),
        unGroupColumn: (id: ColumnId) => set(unGroupColumn(id)),
        resetColumnConfig: (id: ColumnId) => set(resetColumnConfig(id)),
        changeSort: (id: ColumnId, multipleColumnSort: boolean) => set(changeSort(id, multipleColumnSort)),
        setSort: (sort: ColumnId, sortType: SortType, multipleColumnSort: boolean) =>
            set(changeSort(sort, multipleColumnSort, sortType)),
        setLoading: (loading: boolean) => set({ loading }),
        setSorting: (sorting: boolean) => set({ sorting }),
        addFilter: (id: ColumnId, value: IFilter | null, idx?: number) => set(addFilter(id, value, idx)),
        selectAllFilters: (id: ColumnId, options: IFilter[]) => set(selectAllFilters(id, options)),
        pinColumn: (id: ColumnId, pin: PinType) => set(pinColumn(id, pin)),
        setSideBarConfig: (config: SideBarConfig | null) => set(setSideBarConfig(config)),
        updateSelectedCells: (selected: SelectedCells | null) => set(updateSelectedCells(selected)),
        setSelectedStart: (selected: Coords) => set(setSelectedStart(selected)),
        setSelectedEnd: (selected: Coords) => set(setSelectedEnd(selected)),
        setSelecting: (selecting: boolean) => set({ selecting }),
        setMode: (mode: BeastMode) => set({ mode }),
        setPivot: (pivot: Partial<PivotState> | null) => set(setPivot(pivot)),
        restore: () => set(restore(initialState)),
        autoSizeColumns: () => set(autoSizeColumns()),
    }));
};

export type TGridStore = () => StoreApi<GridStore>;
