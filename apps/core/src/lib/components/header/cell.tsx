import { useMemo, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import { BeastGridConfig, Column, Coords, HeaderEvents, SortState } from './../../common/interfaces';
import { MenuHorizontalPosition } from '../../common';

import MenuLayer from '../menu/menu-layer';
import DndLayer from '../dnd/dnd-layer';

import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from '../../hooks/dnd';

import cn from 'classnames';
import { useScrollInViewHook } from '../../hooks/scrollInView';

type Props<T> = {
    levelIdx: number;
    idx: number;
    height: number;
    column: Column;
    headers: Column[][];
    multiSort: boolean;
    dragOptions?: BeastGridConfig<T>['dragOptions'];
    events?: Partial<HeaderEvents>;
    disableSwapColumns?: boolean;
    leftWidth?: number;
};

export default function HeaderCell<T>({
    levelIdx,
    idx,
    height,
    headers,
    column,
    dragOptions,
    multiSort,
    events,
    disableSwapColumns,
    leftWidth
}: Props<T>) {
    const menuRef = useRef<SVGSVGElement>(null);
    const lastX = useRef<number>(0);
    const pointerPosition = useRef<Coords>({ x: 0, y: 0 });
    const lastHitElement = useRef<HTMLElement | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [translateX, setTranslateX] = useState(0);
    const [columns, filters, theme, isPivoted, hideColumn, swapColumns, resizeColumn, container, scrollContainer, changeSort, saveState] =
        useBeastStore((state) => [
            state.columns,
            state.filters,
            state.theme,
            state.isPivoted,
            state.hideColumn,
            state.swapColumns,
            state.resizeColumn,
            state.container,
            state.scrollElement,
            state.changeSort,
            state.saveState
        ]);
    const [dropTargets] = useDndStore((state) => [state.dropTargets]);
    const [drag] = useDndHook(
        {
            ...dragOptions,
            isDropTarget: true,
            onDragStart,
            onDirectionChange,
            onDrag: hitTest,
            onDragEnd,
        },
        container,
        disableSwapColumns,
        leftWidth
    );
    const [resize] = useDndHook({
        ...dragOptions,
        onDragStart: () => setResizing(true),
        onAnimationFrame: handleResize,
        onDragEnd: () => {
            lastX.current = 0;
            setResizing(false);
            saveState();
        },
    });

    const [translate] = useScrollInViewHook({
        column,
        onAnimationFrame: handleTranslate
    })

    function handleTranslate(translate: number) {
        setTranslateX(translate);
    }

    function onDragStart() {
        lastX.current = 0;
        lastHitElement.current = null;
        setShowMenu(false);
        setDragging(true);
    }

    function onDirectionChange() {
        lastHitElement.current = null;
    }


    function hitTest(_: DragEvent, pointer: Coords, _leftWidth?: number) {
        pointerPosition.current = pointer;
        const { left: containerLeft } = container.getBoundingClientRect();
        const scrollLeft = scrollContainer.scrollLeft;
        for (const element of dropTargets) {
            const elementColumn = columns[element?.id];

            const notValidElemnts = !elementColumn || !elementColumn.path || !column.path || elementColumn.pinned !== column.pinned || element.id === lastHitElement.current?.id;

            if (notValidElemnts) {
                continue;
            }

            const sameElement =
                element.id === column.id ||
                elementColumn.parent === column.id;

            if (sameElement) {
                continue;
            }

            if (isPivoted) {
                // swap pivotado
                //  - mismo nivel mismo padre: ok
                //  - distinto nivel:
                //      - si alguno de los padres es distinto y tiene mas de un hijo: no
                //      - si todos los padres tienen un solo hijo: ok
                //      - si todos los padres son iguales: ok
                const isPivotValid =
                    (elementColumn.level === column.level &&
                        elementColumn.parent === column.parent) ||
                    (elementColumn.level === column.level &&
                        elementColumn.path?.every((id, idx) => {
                            const columnParent = column.path?.[idx];
                            const singleChildElement = columns[id].childrenId?.length === 1;
                            const singleChildColumn = columns[columnParent as string].childrenId?.length === 1;
                            const sameParent = id === columnParent;

                            return sameParent || (singleChildElement && singleChildColumn);
                        }))

                if (!isPivotValid) {
                    continue;
                }
            }

            // swap comun
            // - mismo nivel: ok
            // - distinto nivel:
            //  - si el elemento es final: no
            //  - si el elemento es padre del elemento actual: no
            //  - si el elemento es el mismo que el anterior: no

            const isCommonSwapValid =
                elementColumn.level === column.level ||
                (elementColumn.level !== column.level &&
                    elementColumn.final);



            if (!isCommonSwapValid) {
                continue;
            }

            const left = columns[element.id].left + containerLeft - scrollLeft + (leftWidth || 0);
            const width = columns[element.id].width;
            const right = left + width;
            const { x } = pointer;
            const hit = x > left && x < right;

            if (x > 0 && hit && lastHitElement.current !== element) {
                lastHitElement.current = element;
                swapColumns(column.id, element.id);
                break;
            }
        }
    }

    function handleResize(pointer?: Coords) {
        if (!pointer) return;

        if (lastX.current === 0) {
            lastX.current = pointer.x;
        }

        const delta = pointer.x - lastX.current;

        if (delta) {
            const newWidth = columns[column.id].width + delta;

            lastX.current = pointer.x;

            resizeColumn(column.id, newWidth);
        }
    }

    function onDragEnd(_: DragEvent, pointer: Coords) {
        if (pointer.x < 0 || pointer.y < 0) {
            lastHitElement.current = null;

            if (events?.onDropOutside?.hide) {
                hideColumn(column.id);
            }

            if (events?.onDropOutside?.callback) {
                events.onDropOutside.callback(column);
            }
        }
        setDragging(false);
        saveState();
    }

    const handleChangeSort = () => {
        if (column.sortable === false || !column.final) return;

        changeSort(column.id, !!multiSort);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu((state) => !state);
    };

    const renderSortIcon = (sort: SortState) => {
        return (
            <div className="bg-sort-icon row middle">
                {sort.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {sort.priority > 0 && <span className="bg-sort-priority">{sort.priority}</span>}
            </div>
        );
    };

    if (column.hidden || column.logicDelete) return null;

    const RightSide = () => {
        if (!column.menu) {
            return null;
        }

        return (
            <div className="bg-grid-header__cell__menu row middle">
                {filters[column.id]?.length > 0 && <div className="bg-dot--active" />}
                <DotsVerticalIcon
                    ref={menuRef}
                    className={cn('bg-grid-header__menu', { active: showMenu })}
                    onClick={handleMenuClick}
                />
            </div>
        );
    };


    return (
        <div
            className={cn('bg-grid-header__cell row middle between', { lastPinned: column.lastPinned })}
            key={`${levelIdx}-${idx}-${column.id}`}
            style={{
                marginTop: !column.childrenId?.length && levelIdx === 0 ? height * (headers.length - 1) : 0,
                height,
                width: column.width,
                left: column.left,
            }}
            ref={drag}
            id={column.id}
            data-name={column.headerName}
            data-level={column.level}
            data-clone={column.original}
        >
            <div className="bg-grid-header__cell__left row middle"
                style={{ transform: `translateX(${translateX}px)` }}
                onClick={handleChangeSort}>
                <span className={cn('bg-grid-header-drop bg-grid-header__cell__name', { summary: column._summary })}
                    ref={translate}
                    title={column.headerName} >
                    {column.headerName}
                </span>
                {column.sort && renderSortIcon(column.sort)}
            </div>

            <div className="bg-grid-header__cell__menu row middle">
                <RightSide />
            </div>

            <div ref={resize} className={cn('bg-grid-header__resize', { resizing })} />
            <MenuLayer
                visible={showMenu}
                clipRef={() => menuRef.current as SVGSVGElement}
                column={column}
                multiSort={multiSort}
                theme={theme}
                horizontal={MenuHorizontalPosition.LEFT}
                onClose={() => setShowMenu(false)}
            />
            <DndLayer text={column.headerName} hide={!!events?.onDropOutside?.hide} visible={dragging} theme={theme} />
        </div>
    );
}
