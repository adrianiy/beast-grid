import { useEffect, useRef } from 'react';
import { useDndStore } from '../stores/dnd-store';
import { Coords, Direction } from '../common';

export type OnAnimationFrame = (direction: Direction, pointerCoords: Coords) => void;
export type OnDirectionChange = (direction: Direction) => void;
export type OnDragStart = (e: DragEvent) => void;
export type OnDrag = (e: DragEvent) => void;
export type OnDragEnd = (e: DragEvent) => void;

export const useDndHook = (
  options: Partial<{
    autoScrollSpeed: number;
    autoScrollMargin: number;
    isDropTarget: boolean;
    onDirectionChange: (direction: Direction) => void;
    onDragStart: (e: DragEvent) => void;
    onDrag: (e: DragEvent, pointerCoords: Coords) => void;
    onDragEnd: (e: DragEvent, pointerCoords: Coords) => void;
    onAnimationFrame: (pointerCoords: Coords) => void;
  }>,
  parent?: HTMLDivElement
) => {
  const ref = useRef<HTMLDivElement>(null);
  const reqAnimFrameNo = useRef<number>(0);
  const coords = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const direction = useRef<Direction>();
  const [addDropTarget] = useDndStore((state) => [
    state.addDropTarget,
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
      coords.current = { x: e.clientX, y: e.clientY };

      if (parent) {
        parent.style.overflow = 'hidden';
      }
      reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);

      if (e.dataTransfer) {
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
      }

      coords.current = { x: e.clientX, y: e.clientY };
      pointer.current = _getPointerPositionInParent();


      if (options?.onDrag) {
        options.onDrag(e, pointer.current);
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
        options.onDragEnd(e, pointer.current);
      }
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

  useEffect(() => {
    document.addEventListener('dragover', cancel, true);
    document.addEventListener('dragenter', cancel, true);

    return () => {
      document.removeEventListener('dragover', cancel, true);
      document.removeEventListener('dragenter', cancel, true);
    };
  }, []);

  const cancel = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  return [ref];
};
