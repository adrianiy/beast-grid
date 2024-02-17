import { StoreApi, create } from 'zustand';
import { Coords } from '../../common';

export interface DragItem extends Record<string, unknown> {
  id: string;
  hidePreview?: boolean;
}

export interface DndStore {
  dragItem?: DragItem;
  coords?: Coords;
  pointer: Coords;
  direction?: 'right' | 'left';
  dropTargets: HTMLElement[];
  setDragItem: (dragItem?: DragItem) => void;
  setCoords: (coords?: { x: number; y: number }) => void;
  setPointer: (pointer?: { x: number; y: number }) => void;
  setDirection: (direction?: 'right' | 'left') => void;
  addDropTarget: (target: HTMLElement) => void;
}

export const createDndStore = () =>
  create<DndStore>((set) => ({
    pointer: { x: 0, y: 0 },
    dropTargets: [],
    setDragItem: (dragItem?: DragItem) => set({ dragItem }),
    setCoords: (coords?: Coords) => set({ coords }),
    setPointer: (pointer?: Coords) => set({ pointer }),
    setDirection: (direction?: 'right' | 'left') => set({ direction }),
    addDropTarget: (target: HTMLElement) => set((state) => {
      const { dropTargets } = state;

      if (dropTargets.includes(target)) {
        return { dropTargets };
      }
      
      dropTargets.push(target);

      return { dropTargets };
    }),
  }));

export type TDndStore = () => StoreApi<DndStore>;
