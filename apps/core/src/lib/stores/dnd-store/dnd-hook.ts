import { useEffect, useRef } from 'react';
import { DragItem } from './store';
import { useDndStore } from '../dnd-store';

let emptyImage: HTMLImageElement;
export function getEmptyImage() {
  if (!emptyImage) {
    emptyImage = new Image();
    emptyImage.src =
      'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }
  return emptyImage;
}

export const useDndHook = <T>(
  item: DragItem & T,
  options: {
    onDrag?: () => (e: DragEvent) => void;
    onDrop?: () => (e: DragEvent) => void;
  }
) => {
  const ref = useRef<HTMLDivElement>(null);
  const emptyImage = getEmptyImage();
  const [setDragItem, setCoords] = useDndStore((state) => [
    state.setDragItem,
    state.setCoords,
  ]);

  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      setDragItem(item);

      if (e.dataTransfer) {
        e.dataTransfer.setData('id', item.id);
        e.dataTransfer.setDragImage(emptyImage, -10, -10);
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    const onDrag = (e: DragEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });

      if (options.onDrag) {
        options.onDrag()(e);
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (options.onDrop) {
        options.onDrop()(e);
      }
      setCoords(undefined);
      setDragItem(undefined);
      return false;
    };
    if (ref.current) {
      const dragRef = ref.current;

      dragRef.setAttribute('draggable', 'true');

      dragRef.addEventListener('dragstart', onDragStart);

      dragRef.addEventListener('drag', onDrag);

      dragRef.addEventListener('dragend', onDrop);

      return () => {
        dragRef.removeEventListener('dragstart', onDragStart);
        dragRef.removeEventListener('drag', onDrag);
        dragRef.removeEventListener('dragend', onDrop);
      };
    }
  }, [ref, item, options]);

  return [ref];
};
