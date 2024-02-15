import { StoreApi, create } from 'zustand';

export interface DragItem extends Record<string, unknown> {
  id: string;
  hidePreview?: boolean;
}

export type Coords = { x: number; y: number };

export interface DndStore {
  dragItem?: DragItem;
  coords?: Coords;
  pointer: Coords;
  direction?: 'right' | 'left';
  setDragItem: (dragItem?: DragItem) => void;
  setCoords: (coords?: { x: number; y: number }) => void;
  setPointer: (pointer?: { x: number; y: number }) => void;
  setDirection: (direction?: 'right' | 'left') => void;
}

export const createDndStore = () =>
  create<DndStore>((set) => ({
    pointer: { x: 0, y: 0 },
    setDragItem: (dragItem?: DragItem) => set({ dragItem }),
    setCoords: (coords?: Coords) => set({ coords }),
    setPointer: (pointer?: Coords) => set({ pointer }),
    setDirection: (direction?: 'right' | 'left') => set({ direction }),
  }));

export type TDndStore = () => StoreApi<DndStore>;
