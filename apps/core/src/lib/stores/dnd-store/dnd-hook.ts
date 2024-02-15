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
  options: Partial<{
    autoScrollSpeed: number;
    autoScrollMargin: number;
    hitTestElements: string[];
    onDrag: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;
    onHitElement: (e: HTMLElement) => void;
  }>,
  parent?: HTMLDivElement
) => {
  const ref = useRef<HTMLDivElement>(null);
  const reqAnimFrameNo = useRef<number>(0);
  const startCoords = useRef({ x: 0, y: 0 });
  const coords = useRef({ x: 0, y: 0 });
  const direction = useRef<'right' | 'left'>();
  const hitElements = useRef<HTMLElement[]>([]);
  const lastHitElement = useRef<HTMLElement>();
  const emptyImage = getEmptyImage();
  const [setDragItem, setCoords, setPointer, setDirection] = useDndStore(
    (state) => [
      state.setDragItem,
      state.setCoords,
      state.setPointer,
      state.setDirection,
    ]
  );

  useEffect(() => {
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

    const _getHitStatus = () => {
      if (hitElements.current.length && parent && direction.current) {
        const elementData = hitElements.current.filter(Boolean).map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            el,
          };
        });
        const directionElements = elementData.filter((el) => {
          const { left, right } = el;
          const x = coords.current.x;

          return direction.current === 'right' ? right > x : left < x;
        }).sort((a, b) => {
          return direction.current === 'right' ? a.left - b.left : b.right - a.right;
        });

        if (directionElements.length) {
          const possibleHit = directionElements[0];

          const x = coords.current.x;
          
          const { left, right } = possibleHit;
          const inBox = direction.current === 'right'
            ? left < x
            : right > x;

          if (inBox && possibleHit.el !== lastHitElement.current) {
            lastHitElement.current = possibleHit.el;
            options.onHitElement?.(possibleHit.el);
          }
        }
      }
    };

    const handleAnimations = () => {
      if (!parent || !coords) {
        reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);
        return;
      }
      _getHitStatus();

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
          (autoScrollSpeed *
            (1 - Math.max(0, right - pointerX) / autoScrollMargin)) |
          0
        );
      } else if (pointerX < left + autoScrollMargin && parent.scrollLeft) {
        changeX = Math.max(
          -parent.scrollLeft,
          (-autoScrollSpeed *
            (1 - Math.max(0, pointerX - left) / autoScrollMargin)) |
          0
        );
      }

      if (changeX) {
        parent.scrollLeft += changeX;
      }

      reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);
    };
    const onDragStart = (e: DragEvent) => {
      setDragItem(item);
      setPointer(_getPointerPositionInParent());

      if (options?.hitTestElements) {
        hitElements.current = options.hitTestElements.map((el) => {
          return document.getElementById(el) as HTMLElement;
        });
      }

      coords.current = { x: e.clientX, y: e.clientY };
      startCoords.current = { x: e.clientX, y: e.clientY };
      
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
    };

    const onDrag = (e: DragEvent) => {
      if (e.clientX !== coords.current.x) {
        const newDirection = e.clientX >= coords.current.x ? 'right' : 'left';
        
        if (newDirection !== direction.current) {
          lastHitElement.current = undefined;
          direction.current = newDirection;
          setDirection(newDirection);
        }
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

      lastHitElement.current = undefined;
      direction.current = undefined;
      coords.current = { x: 0, y: 0 };
      
      cancelAnimationFrame(reqAnimFrameNo.current);

      if (parent) {
        parent.style.overflow = 'scroll';
      }
      if (options?.onDragEnd) {
        options.onDragEnd(e);
      }
      setCoords({ x: 0, y: 0});
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
  }, [ref, item, options]);

  return [ref];
};
