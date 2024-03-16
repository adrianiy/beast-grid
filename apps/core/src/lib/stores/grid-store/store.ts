import { StoreApi, create } from 'zustand';
import {
  addFilter,
  changeSort,
  deleteEmptyParents,
  groupByColumn,
  hideColumn,
  pinColumn,
  resetColumnConfig,
  resizeColumn,
  selectAllFilters,
  setColumn,
  setSelectedEnd,
  setSelectedStart,
  swapColumns,
  unGroupColumn,
  updateSelectedCells,
} from './actions';
import { Column, ColumnId, ColumnStore, Data, IFilter } from './../../common/interfaces';
import { BeastGridConfig, BeastMode, Coords, PinType, SelectedCells, SideBarConfig, SortType, TreeConstructor } from '../../common';
import { createVirtualIds, getColumnsFromDefs, initialize, moveColumns, sortColumns } from './utils';

interface GridState {
  data: Data;
  columns: ColumnStore;
  theme: string;
  container: HTMLDivElement;
  allowMultipleColumnSort: boolean;
  sort: ColumnId[];
  tree: Partial<TreeConstructor> | undefined;
  groupOrder: ColumnId[];
  initialData: Data;
  sortedColumns: Column[];
  loading: boolean;
  sorting: boolean;
  scrollElement: HTMLDivElement;
  filters: Record<ColumnId, IFilter[]>;
  sideBarConfig: SideBarConfig | null;
  selectedCells: SelectedCells | null;
  selecting: boolean;
  mode: BeastMode;
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
}

export const createGridStore = <T>(
  { data: _data, columnDefs, defaultColumnDef, sort, tree }: BeastGridConfig<T>,
  container: HTMLDivElement,
  theme: string
) => {
  const columns = getColumnsFromDefs(columnDefs, defaultColumnDef);
  const groupOrder = Object.values(columns).filter((col) => col.rowGroup).map((col) => col.id);
  const initialData = createVirtualIds(_data as Data);
  
  const data = initialize(columns, container, initialData, groupOrder, tree);
  const sortedColumns = sortColumns(columns);
  
  moveColumns(columns, sortedColumns, PinType.LEFT);
  moveColumns(columns, sortedColumns, PinType.NONE);

  const initialState = {
    data,
    initialData,
    tree,
    groupOrder,
    columns,
    sortedColumns,
    allowMultipleColumnSort: !!sort?.multiple,
    container,
    theme,
    sort: [],
    selectedCells: null,
    mode: BeastMode.GRID
  };
  
  return create<GridStore>((set) => ({
    ...initialState,
    filters: {},
    loading: false,
    sorting: false,
    scrollElement: null as unknown as HTMLDivElement,
    sideBarConfig: null,
    selecting: false,
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
    setSideBarConfig: (config: SideBarConfig | null) => set({ sideBarConfig: config }),
    updateSelectedCells: (selected: SelectedCells | null) => set(updateSelectedCells(selected)),
    setSelectedStart: (selected: Coords) => set(setSelectedStart(selected)),
    setSelectedEnd: (selected: Coords) => set(setSelectedEnd(selected)),
    setSelecting: (selecting: boolean) => set({ selecting }),
    setMode: (mode: BeastMode) => set({ mode }),
  }));
};

export type TGridStore = () => StoreApi<GridStore>;
