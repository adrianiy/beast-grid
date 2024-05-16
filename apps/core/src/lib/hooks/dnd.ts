import { useEffect, useRef } from 'react';
import { useDndStore } from '../stores/dnd-store';
import { Coords, Direction, PinType } from '../common';
import { useBeastStore } from '../stores/beast-store';

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
    parent?: HTMLDivElement,
    disable?: boolean
) => {
    const ref = useRef<HTMLDivElement>(null);
    const reqAnimFrameNo = useRef<number>(0);
    const coords = useRef({ x: 0, y: 0 });
    const pointer = useRef({ x: 0, y: 0 });
    const direction = useRef<Direction>();
    const preview = useRef<HTMLImageElement>(new Image());
    const isDragging = useRef<boolean>(false);
    const leftPinnedWidth = useRef<number>(0);
    const [addDropTarget, setPointer, setCoords] = useDndStore((state) => [
        state.addDropTarget,
        state.setPointer,
        state.setCoords,
    ]);
    const [scrollElement, columns] = useBeastStore((state) => [state.scrollElement, state.columns]);

    useEffect(() => {
        if (disable) {
            return;
        }
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

            setPointer(pointer.current);
            setCoords(coords.current);
            const { left: _raw, right } = parent.getBoundingClientRect();
            const left = _raw + leftPinnedWidth.current;
            const pointerX = coords.current.x;
            const autoScrollMargin = options.autoScrollSpeed || 150;
            const autoScrollSpeed = options.autoScrollMargin || 10;
            let changeX = 0;

            const gap = _getMaxScroll(scrollElement) - scrollElement.scrollLeft;
            if (gap < 0) {
                changeX = gap;
            } else if (pointerX > right - autoScrollMargin && gap) {
                changeX = Math.min(
                    autoScrollSpeed,
                    (autoScrollSpeed * (1 - Math.max(0, right - pointerX) / autoScrollMargin)) | 0
                );
            } else if (pointerX < left + autoScrollMargin && scrollElement.scrollLeft) {
                changeX = Math.max(
                    -scrollElement.scrollLeft,
                    (-autoScrollSpeed * (1 - Math.max(0, pointerX - left) / autoScrollMargin)) | 0
                );
            }

            if (changeX && scrollElement) {
                scrollElement.scrollLeft += changeX;
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
            e.stopPropagation();
            isDragging.current = true;
            coords.current = { x: e.clientX, y: e.clientY };

            reqAnimFrameNo.current = requestAnimationFrame(handleAnimations);

            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setDragImage(preview.current, 0, 0);
            }

            if (options?.onDragStart) {
                options.onDragStart(e);
            }
        };

        const onDrag = (e: DragEvent) => {
            e.stopPropagation();
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
            e.stopPropagation();

            if (options?.onDragEnd) {
                options.onDragEnd(e, pointer.current);
            }

            setTimeout(() => {
                cancelAnimationFrame(reqAnimFrameNo.current);
                isDragging.current = false;
                coords.current = { x: 0, y: 0 };
            }, 300);

            return false;
        };

        if (ref.current && scrollElement) {
            const dragRef = ref.current;
            preview.current.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

            if (columns) {
                leftPinnedWidth.current = Object.values(columns).reduce((acc, column) => {
                    return column.pinned === PinType.LEFT ? acc + column.width : acc;
                }, 0);
            }

            dragRef.setAttribute('draggable', 'true');

            dragRef.addEventListener('dragstart', onDragStart);

            dragRef.addEventListener('drag', onDrag);

            dragRef.addEventListener('dragend', onDragEnd);

            return () => {
                cancelAnimationFrame(reqAnimFrameNo.current);
                dragRef.removeEventListener('dragstart', onDragStart);
                dragRef.removeEventListener('drag', onDrag);
                dragRef.removeEventListener('dragend', onDragEnd);
            };
        }
    }, [ref, scrollElement, disable]);

    return [ref];
};
