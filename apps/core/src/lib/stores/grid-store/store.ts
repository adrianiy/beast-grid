import { StoreApi, create } from 'zustand';
import {
  addFilter,
  changeSort,
  deleteEmptyParents,
  fixColumnPositions,
  hideColumn,
  resetColumnConfig,
  resizeColumn,
  selectAllFilters,
  setColumn,
  swapColumns,
} from './actions';
import { Column, ColumnId, ColumnStore, Data, IFilter } from './../../common/interfaces';
import { BeastGridConfig, SortType } from '../../common';
import { getColumnsFromDefs, initialize, moveColumns } from './utils';

interface GridState {
  data: Data;
  columns: ColumnStore;
  container: HTMLDivElement;
  allowMultipleColumnSort: boolean;
  sort: ColumnId[];
}

interface InferedState {
  loading: boolean;
  sorting: boolean;
  filters: Record<ColumnId, IFilter[]>;
}

export interface GridStore extends GridState, InferedState {
  setData: (data: Data) => void;
  setColumns: (columns: ColumnStore) => void;
  setColumn: (args: { id: string; column: Column }) => void;
  hideColumn: (id: ColumnId) => void;
  fixColumnPositions: () => void;
  cleanColumns: () => void;
  swapColumns: (id1: ColumnId, id2: ColumnId) => void;
  resizeColumn: (id: ColumnId, width: number) => void;
  resetColumnConfig: (id: ColumnId) => void;
  changeSort: (id: ColumnId, multipleColumnSort: boolean) => void;
  setSort: (sort: ColumnId, sortType: SortType, multipleColumnSort: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSorting: (sorting: boolean) => void;
  addFilter: (id: ColumnId, value: IFilter) => void;
  selectAllFilters: (id: ColumnId) => void;
}

export const createGridStore = <T>(
  { data: _data, columnDefs, defaultColumnDef, mulitSort }: BeastGridConfig<T>,
  container: HTMLDivElement
) => {
  const columns = getColumnsFromDefs(columnDefs, defaultColumnDef);
  const data = initialize(columns, container, _data as Data);
  
  moveColumns(columns);

  const initialState = {
    data,
    columns,
    allowMultipleColumnSort: !!mulitSort,
    container,
    sort: [],
  };
  
  return create<GridStore>((set) => ({
    ...initialState,
    filters: {},
    loading: false,
    sorting: false,
    setData: (data: Data) => set({ data }),
    setColumns: (columns: ColumnStore) => set({ columns }),
    setColumn: (payload) => set(setColumn(payload.id, payload.column)),
    hideColumn: (id: ColumnId) => set(hideColumn(id)),
    fixColumnPositions: () => set(fixColumnPositions()),
    cleanColumns: () => set(deleteEmptyParents()),
    swapColumns: (id1: ColumnId, id2: ColumnId) => set(swapColumns(id1, id2)),
    resizeColumn: (id: ColumnId, width: number) => set(resizeColumn(id, width)),
    resetColumnConfig: (id: ColumnId) => set(resetColumnConfig(id)),
    changeSort: (id: ColumnId, multipleColumnSort: boolean) => set(changeSort(id, multipleColumnSort)),
    setSort: (sort: ColumnId, sortType: SortType, multipleColumnSort: boolean) =>
      set(changeSort(sort, multipleColumnSort, sortType)),
    setLoading: (loading: boolean) => set({ loading }),
    setSorting: (sorting: boolean) => set({ sorting }),
    addFilter: (id: ColumnId, value: IFilter) => set(addFilter(id, value)),
    selectAllFilters: (id: ColumnId) => set(selectAllFilters(id)),
  }));
};

export type TGridStore = () => StoreApi<GridStore>;
