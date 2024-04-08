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
import { createVirtualIds, getColumnsFromDefs, initialize, moveColumns, setColumnAggregationDefaults, sortColumns } from './utils';
import { clone } from '../../utils/functions';

export interface PivotState {
    columns: Column[];
    rows: Column[];
    values: Column[];
    data: Data;
    enabled: boolean;
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
    selectAllFilters: (id: ColumnId) => void;
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
    { data: _data, columnDefs, defaultColumnDef, sort, tree }: BeastGridConfig<T>,
    container: HTMLDivElement,
    theme: string
) => {
    const columns = getColumnsFromDefs(columnDefs, defaultColumnDef);

    const groupOrder = Object.values(columns)
        .filter((col) => col.rowGroup)
        .map((col) => col.id);
    const initialData = createVirtualIds(_data as Data);

    const data = initialize(columns, container, initialData, groupOrder, tree);
    const sortedColumns = sortColumns(columns);

    moveColumns(columns, sortedColumns, PinType.LEFT);
    moveColumns(columns, sortedColumns, PinType.NONE);

    const initialState = {
        edited: false,
        defaultColumnDef,
        data,
        initialData: clone(initialData),
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
    };

    return create<GridStore>((set) => ({
        ...clone(initialState),
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
        selectAllFilters: (id: ColumnId) => set(selectAllFilters(id)),
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
