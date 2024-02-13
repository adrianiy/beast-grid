import { StoreApi, create } from 'zustand';
import { changeSort, hideColumn, resizeColumn, setColumn, swapColumns } from './actions';
import { Column, ColumnStore } from './../../common/interfaces';

interface GridState {
  columns: ColumnStore;
  container: HTMLDivElement;
  sort: ColumnId[];
}

export interface GridStore extends GridState {
  setColumns: (columns: ColumnStore) => void;
  setColumn: (args: { id: string; column: Column }) => void;
  hideColumn: (id: string) => void;
  swapColumns: (id1: string, id2: string) => void;
  resizeColumn: (id: string, width: number) => void;
  changeSort: (id: string, multipleColumnSort: boolean) => void;
}

export const createGridStore = (initialState: Partial<GridState>) => create<GridStore>((set) => ({
  ...initialState,
  setColumns: (columns: ColumnStore) => set({ columns }),
  setColumn: (payload) => set(setColumn(payload.id, payload.column)),
  hideColumn: (id: string) => set(hideColumn(id)),
  swapColumns: (id1: string, id2: string) => set(swapColumns(id1, id2)),
  resizeColumn: (id: string, width: number) => set((resizeColumn(id, width))),
  changeSort: (id: string, multipleColumnSort: boolean) => set(changeSort(id, multipleColumnSort)),
}));

export type TGridStore = () => StoreApi<GridStore>;
