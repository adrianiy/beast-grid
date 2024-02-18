import { useEffect, useRef } from 'react';
import { DragItem } from './../stores/dnd-store/store';
import { useDndStore } from '../stores/dnd-store';
import { Coords, Direction } from '../common';

let emptyImage: HTMLImageElement;
export function getEmptyImage() {
  if (!emptyImage) {
    emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }
  return emptyImage;
}

export type OnAnimationFrame = (direction: Direction, pointerCoords: Coords) => void;
export type OnDirectionChange = (direction: Direction) => void;
export type OnDragStart = (e: DragEvent) => void;
export type OnDrag = (e: DragEvent) => void;
export type OnDragEnd = (e: DragEvent) => void;

export const useDndHook = <T>(
  item: DragItem & T,
  options: Partial<{
    autoScrollSpeed: number;
    autoScrollMargin: number;
    isDropTarget: boolean;
    onDirectionChange: (direction: Direction) => void;
    onDragStart: (e: DragEvent) => void;
    onDrag: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;
    onAnimationFrame: (pointerCoords: Coords) => void;
  }>,
  parent?: HTMLDivElement
) => {
  const ref = useRef<HTMLDivElement>(null);
  const reqAnimFrameNo = useRef<number>(0);
  const coords = useRef({ x: 0, y: 0 });
  const direction = useRef<Direction>();
  const emptyImage = getEmptyImage();
  const [setDragItem, setCoords, setPointer, setDirection, addDropTarget] = useDndStore((state) => [
    state.setDragItem,
    state.setCoords,
    state.setPointer,
    state.setDirection,
    state.addDropTarget
  ]);

  useEffect(() => { 
    if (options?.isDropTarget && ref.current) {
      addDropTarget(ref.current);
    }
    const _getMaxScroll = (element: HTMLDivElement) => {
      return element.scrollWidth - element.clientWidth;
    };
    const _getPointerPositionInParent = () => {
      if (!parent) {
        return { x: 0, y: 0 };
      }
      let { x, y } = coords.current;
      const rect = parent.getBoundingClientRect();
      const maxX = rect.right;
      const minX = rect.left;
      const maxY = rect.bottom;
      const minY = rect.top;

      if (x > maxX) {
        x = maxX - x;
      } else if (x < minX) {
        x = x - minX;
      }

      if (y > maxY) {
        y = maxY - y;
      } else if (y < minY) {
        y = y - minY;
      }

      return {
        x,
        y,
      };
    };

    const _handleAutoScroll = () => {
      if (!parent) {
        reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);
        return;
      }
      const { left, right } = parent.getBoundingClientRect();
      const pointerX = coords.current.x;
      const autoScrollMargin = options.autoScrollSpeed || 100;
      const autoScrollSpeed = options.autoScrollMargin || 40;
      let changeX = 0;

      const gap = _getMaxScroll(parent) - parent.scrollLeft;
      if (gap < 0) {
        changeX = gap;
      } else if (pointerX > right - autoScrollMargin && gap) {
        changeX = Math.min(
          autoScrollSpeed,
          (autoScrollSpeed * (1 - Math.max(0, right - pointerX) / autoScrollMargin)) | 0
        );
      } else if (pointerX < left + autoScrollMargin && parent.scrollLeft) {
        changeX = Math.max(
          -parent.scrollLeft,
          (-autoScrollSpeed * (1 - Math.max(0, pointerX - left) / autoScrollMargin)) | 0
        );
      }

      if (changeX) {
        parent.scrollLeft += changeX;
      }
    };

    const handleAnimations = () => {
      options?.onAnimationFrame?.(coords.current);
      
      if (!parent || !coords) {
        reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);
        return;
      }

      _handleAutoScroll();

      reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);
    };
    
    const onDragStart = (e: DragEvent) => {
      setDragItem(item);
      setPointer(_getPointerPositionInParent());

      coords.current = { x: e.clientX, y: e.clientY };

      setCoords(coords.current);

      if (parent) {
        parent.style.overflow = 'hidden';
      }
      reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);

      if (e.dataTransfer) {
        e.dataTransfer.setData('id', item.id);
        e.dataTransfer.setDragImage(emptyImage, -10, -10);
        e.dataTransfer.effectAllowed = 'move';
      }

      if (options?.onDragStart) {
        options.onDragStart(e);
      }
    };

    const onDrag = (e: DragEvent) => {
      if (e.clientX !== coords.current.x) {
        const newDirection = e.clientX >= coords.current.x ? Direction.RIGHT : Direction.LEFT;

        if (newDirection !== direction.current) {
          direction.current = newDirection;
          options?.onDirectionChange?.(newDirection);
        }
        setDirection(newDirection);
      }

      coords.current = { x: e.clientX, y: e.clientY };

      setCoords(coords.current);
      setPointer(_getPointerPositionInParent());

      if (options?.onDrag) {
        options.onDrag(e);
      }
    };

    const onDragEnd = (e: DragEvent) => {
      e.preventDefault();

      coords.current = { x: 0, y: 0 };

      cancelAnimationFrame(reqAnimFrameNo.current);

      if (parent) {
        parent.style.overflow = 'scroll';
      }
      if (options?.onDragEnd) {
        options.onDragEnd(e);
      }
      setCoords({ x: 0, y: 0 });
      setDragItem(undefined);
      return false;
    };
    if (ref.current) {
      const dragRef = ref.current;

      dragRef.setAttribute('draggable', 'true');

      dragRef.addEventListener('dragstart', onDragStart);

      dragRef.addEventListener('drag', onDrag);

      dragRef.addEventListener('dragend', onDragEnd);

      return () => {
        dragRef.removeEventListener('dragstart', onDragStart);
        dragRef.removeEventListener('drag', onDrag);
        dragRef.removeEventListener('dragend', onDragEnd);
      };
    }
  }, [ref]);

  return [ref];
};
