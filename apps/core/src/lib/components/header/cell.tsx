import { useRef, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import { BeastGridConfig, Column, Coords, HeaderEvents, SortState } from './../../common/interfaces';
import { MenuHorizontalPosition } from '../../common';

import MenuLayer from '../menu/menu-layer';
import DndLayer from '../dnd/dnd-layer';

import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from '../../hooks/dnd';

import cn from 'classnames';

type Props<T> = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  multiSort: boolean;
  dragOptions?: BeastGridConfig<T>['dragOptions'];
  events?: Partial<HeaderEvents>;
};

export default function HeaderCell<T>({ levelIdx, idx, height, column, dragOptions, multiSort, events }: Props<T>) {
  const menuRef = useRef<SVGSVGElement>(null);
  const lastX = useRef<number>(0);
  const pointerPosition = useRef<Coords>({ x: 0, y: 0 });
  const lastHitElement = useRef<HTMLElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [columns, filters, theme, hideColumn, swapColumns, resizeColumn, container, changeSort] = useBeastStore((state) => [
    state.columns,
    state.filters,
    state.theme,
    state.hideColumn,
    state.swapColumns,
    state.resizeColumn,
    state.container,
    state.changeSort,
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
    container
  );
  const [resize] = useDndHook(
    {
      ...dragOptions,
      onAnimationFrame: handleResize,
      onDragEnd: () => (lastX.current = 0),
    }
  );

  function onDragStart() {
    lastX.current = 0;
    lastHitElement.current = null;
    setShowMenu(false);
    setDragging(true);
  }

  function onDirectionChange() {
    lastHitElement.current = null;
  }

  function hitTest(_: DragEvent, pointer: Coords) {
    pointerPosition.current = pointer;
    for (const element of dropTargets) {
      const elementColumn = columns[element?.id];
      if (
        !elementColumn ||
        elementColumn.logicDelete ||
        elementColumn.pinned !== column.pinned ||
        element.id === column.id ||
        elementColumn.parent === column.id ||
        elementColumn.level > column.level ||
        (elementColumn.level < column.level && !elementColumn.final) ||
        element.id === column.parent ||
        element.id === lastHitElement.current?.id
      )
        continue;

      const { left } = element.getBoundingClientRect();
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
  }

  const handleChangeSort = () => {
    if (column.sortable === false || !column.final) return;

    changeSort(column.id, !!multiSort);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(state => !state);
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
      <div className="bg-grid-header__cell__left row middle" onClick={handleChangeSort}>
        <span className="bg-grid-header-drop bg-grid-header__cell__name">{column.headerName}</span>
        {filters[column.id]?.length > 0 && <div className="bg-dot--active" />}
        {column.sort && renderSortIcon(column.sort)}
      </div>

      <div className="bg-grid-header__cell__menu row middle">
        <RightSide />
      </div>

      <div ref={resize} className="bg-grid-header__resize" />
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
