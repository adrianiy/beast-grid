import { StoreApi, create } from 'zustand';
import { ColumnId, Coords } from '../../common';

export interface MenuState {
  column?: ColumnId;
  coords?: Coords;
  clipRef?: () => HTMLDivElement;
}

export interface MenuActions {
  initializeState: (state: MenuState) => void;
  setColumn: (column?: ColumnId) => void;
  setCoords: (coords?: Coords) => void;
  setClipRef: (clipRef: () => HTMLDivElement) => void;
}

export type MenuStore = MenuState & MenuActions;

export const createMenuStore = () =>
  create<MenuStore>((set) => ({
    initializeState: (state: MenuState) => set(state),
    setColumn: (column?: ColumnId) => set({ column }),
    setCoords: (coords?: Coords) => set({ coords }),
    setClipRef: (clipRef: () =>  HTMLDivElement) => set({ clipRef }),
  }));

export type TMenuStore = () => StoreApi<MenuStore>;
