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
  swapColumns,
  unGroupColumn,
} from './actions';
import { Column, ColumnId, ColumnStore, Data, IFilter } from './../../common/interfaces';
import { BeastGridConfig, PinType, SideBarConfig, SortType, TreeConstructor } from '../../common';
import { createVirtualIds, getColumnsFromDefs, initialize, moveColumns, sortColumns } from './utils';

interface GridState {
  data: Data;
  columns: ColumnStore;
  theme: string;
  container: HTMLDivElement;
  allowMultipleColumnSort: boolean;
  sort: ColumnId[];
}

interface InferedState {
  tree: Partial<TreeConstructor> | undefined;
  groupOrder: ColumnId[];
  initialData: Data;
  sortedColumns: Column[];
  loading: boolean;
  sorting: boolean;
  scrollElement: HTMLDivElement;
  filters: Record<ColumnId, IFilter[]>;
  sideBarConfig: SideBarConfig | null;
}

export interface GridStore extends GridState, InferedState {
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
  addFilter: (id: ColumnId, value: IFilter) => void;
  selectAllFilters: (id: ColumnId) => void;
  pinColumn: (id: ColumnId, pin: PinType) => void;
  setSideBarConfig: (config: SideBarConfig | null) => void;
}

export const createGridStore = <T>(
  { data: _data, columnDefs, defaultColumnDef, sort, tree }: BeastGridConfig<T>,
  container: HTMLDivElement,
  theme: string
) => {
  const columns = getColumnsFromDefs(columnDefs, defaultColumnDef);
  const groupOrder = Object.values(columns).filter((col) => col.rowGroup).map((col) => col.id);
  
  const data = initialize(columns, container, createVirtualIds(_data as Data), groupOrder, tree);
  const sortedColumns = sortColumns(columns);
  
  moveColumns(columns, sortedColumns, PinType.LEFT);
  moveColumns(columns, sortedColumns, PinType.NONE);

  const initialState = {
    data,
    initialData: data,
    tree,
    groupOrder,
    columns,
    sortedColumns,
    allowMultipleColumnSort: !!sort?.multiple,
    container,
    theme,
    sort: [],
  };
  
  return create<GridStore>((set) => ({
    ...initialState,
    filters: {},
    loading: false,
    sorting: false,
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
    addFilter: (id: ColumnId, value: IFilter) => set(addFilter(id, value)),
    selectAllFilters: (id: ColumnId) => set(selectAllFilters(id)),
    pinColumn: (id: ColumnId, pin: PinType) => set(pinColumn(id, pin)),
    setSideBarConfig: (config: SideBarConfig | null) => set({ sideBarConfig: config }),
  }));
};

export type TGridStore = () => StoreApi<GridStore>;
