import { StoreApi, create } from 'zustand';
import {
    addFilter,
    autoSizeColumns,
    changeSort,
    clearHistory,
    deleteEmptyParents,
    groupByColumn,
    hideColumn,
    pinColumn,
    redo,
    resetColumnConfig,
    resizeColumn,
    restore,
    saveState,
    selectAllFilters,
    setColumn,
    setColumnsVisibility,
    setData,
    setInitialPivot,
    setPivot,
    setSelectedEnd,
    setSelectedStart,
    setSideBarConfig,
    swapColumns,
    undo,
    unGroupColumn,
    updateColumnDefs,
    updateSelectedCells,
} from './actions';
import { Column, ColumnId, ColumnStore, Data, IFilter } from './../../common/interfaces';
import {
    BeastGridConfig,
    BeastMode,
    ColumnDef,
    Coords,
    OnChanges,
    PinType,
    PivotConfig,
    SelectedCells,
    SideBarConfig,
    SortType,
    TreeConstructor,
} from '../../common';
import { createVirtualIds, getColumnsFromDefs, initialize, moveColumns, saveSnapshot, sortColumns } from './utils';

export interface PivotState {
    columns: Column[];
    rows: Column[];
    values: Column[];
    data: Data;
    enabled: boolean;
    columnTotals: boolean;
    rowTotals: boolean;
    rowGroups: boolean;
    snapshotBeforePivot: number;
}

export interface DynamicState {
    sort: ColumnId[];
    groupOrder: ColumnId[];
    columns: ColumnStore;
    pivotData?: Data;
    groupData?: Data;
    topRows?: Data;
    bottomRows?: Data;
    isGrouped?: boolean;
    isPivoted?: boolean;
    sortedColumns: Column[];
    hiddenColumns: ColumnId[];
    filters: Record<ColumnId, IFilter[]>;
    pivot?: Partial<PivotState>;
    historyPoint: number;
}

export interface GridState extends DynamicState {
    edited: boolean;
    initialized: boolean;
    data: Data;
    theme: string;
    container: HTMLDivElement;
    defaultColumnDef: Partial<ColumnDef> | undefined;
    allowMultipleColumnSort: boolean;
    tree: Partial<TreeConstructor> | undefined;
    loading: boolean;
    sorting: boolean;
    scrollElement: HTMLDivElement;
    sideBarConfig: SideBarConfig | null;
    selectedCells: SelectedCells | null;
    selecting: boolean;
    mode: BeastMode;
    snapshots: DynamicState[];
    haveChanges: boolean;
    onChanges?: OnChanges;
}

export interface GridStore extends GridState {
    setData: (data: Data, pivot?: PivotConfig) => void;
    setColumns: (columns: ColumnStore) => void;
    updateColumnDefs: (columnDefs: ColumnDef[], pivotConfig?: PivotConfig) => void;
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
    setInitialPivot: (pivot: PivotConfig) => void;
    restore: () => void;
    updateColumnVisibility: (scrollLeft: number) => void;
    autoSizeColumns: () => void;
    saveState: () => void;
    clearHistory: () => void;
    undo: () => void;
    redo: () => void;
}

export const createGridStore = <T>(
    { data: _data, columnDefs, defaultColumnDef, sort, tree }: BeastGridConfig<T>,
    container: HTMLDivElement,
    theme: string,
    onChanges?: OnChanges
) => {
    const columns = getColumnsFromDefs(columnDefs, defaultColumnDef);

    const groupOrder = Object.values(columns)
        .filter((col) => col.rowGroup)
        .map((col) => col.id);
    const initialData = createVirtualIds(_data as Data);

    const data = initialize(columns, container, initialData, groupOrder, tree);
    const sortedColumns = sortColumns(columns, onChanges);

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);

    const initialState: GridState = {
        edited: false,
        defaultColumnDef,
        data,
        hiddenColumns: sortedColumns.filter((col) => col.hidden).map((col) => col.id),
        tree,
        groupOrder,
        columns,
        sortedColumns,
        allowMultipleColumnSort: !!sort?.multiple,
        theme,
        snapshots: [],
        sort: [],
        selectedCells: null,
        filters: {},
        loading: false,
        sorting: false,
        selecting: false,
        initialized: data.length > 0,
        container,
        mode: BeastMode.GRID,
        scrollElement: null as unknown as HTMLDivElement,
        sideBarConfig: null,
        historyPoint: 0,
        haveChanges: false,
        onChanges
    };

    const [snapshots, historyPoint] = saveSnapshot(initialState as any as GridStore);

    initialState.snapshots = snapshots;
    initialState.historyPoint = historyPoint;

    return create<GridStore>((set) => ({
        ...initialState,
        setData: (data: Data, pivot?: PivotConfig) => set(setData(data, pivot)),
        setColumns: (columns: ColumnStore) => set({ columns }),
        updateColumnDefs: (columnDefs: ColumnDef[], pivotConfig: PivotConfig | undefined) => set(updateColumnDefs(columnDefs, pivotConfig)),
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
        setInitialPivot: (pivot: PivotConfig) => set(setInitialPivot(pivot)),
        restore: () => set(restore()),
        updateColumnVisibility: (scrollLeft: number) => set(setColumnsVisibility(scrollLeft)),
        autoSizeColumns: () => set(autoSizeColumns()),
        saveState: () => set(saveState()),
        clearHistory: () => set(clearHistory()),
        undo: () => set(undo()),
        redo: () => set(redo()),
    }));
};

export type TGridStore = () => StoreApi<GridStore>;
