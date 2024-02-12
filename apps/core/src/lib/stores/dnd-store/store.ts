import { create } from 'zustand';

export interface DragItem extends Record<string, unknown> {
  id: string;
  hidePreview?: boolean;
}

export type Coords = { x: number; y: number };

export interface DndStore {
  dragItem?: DragItem;
  coords?: Coords;
  setDragItem: (dragItem?: DragItem) => void;
  setCoords: (coords?: { x: number; y: number }) => void;
}

export const useDndStore = create<DndStore>((set) => ({
  setDragItem: (dragItem?: DragItem) => set({ dragItem }),
  setCoords: (coords?: Coords) => set({ coords }),
}));
