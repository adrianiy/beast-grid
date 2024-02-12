import { create } from 'zustand';
import { hideColumn, resizeColumn, setColumn, swapColumns } from './actions';
import { Column, ColumnArray, ColumnStore } from './../../common/interfaces';

interface GridState {
  columnDefs: ColumnStore;
  columns: ColumnArray;
  container: HTMLDivElement;
}

export interface GridStore extends GridState {
  setColumnDefs: (columnDefs: ColumnStore) => void;
  setColumn: (args: { id: string; column: Column }) => void;
  hideColumn: (id: string) => void;
  swapColumns: (id1: string, id2: string) => void;
  resizeColumn: (id: string, width: number) => void;
}

export const createGridStore = (initialState: GridState) => create<GridStore>((set) => ({
  ...initialState,
  setColumnDefs: (columnDefs: ColumnStore) => set({ columnDefs }),
  setColumn: (payload) => set(setColumn(payload.id, payload.column)),
  hideColumn: (id: string) => set(hideColumn(id)),
  swapColumns: (id1: string, id2: string) => set(swapColumns(id1, id2)),
  resizeColumn: (id: string, width: number) => set((resizeColumn(id, width))),
}));
