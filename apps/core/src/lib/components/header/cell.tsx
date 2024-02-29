import { useRef } from 'react';
import { ArrowUpward, ArrowDownward, Menu } from '@mui/icons-material';
import { BeastGridConfig, Column, Coords, HeaderEvents, SortState } from './../../common/interfaces';
import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from '../../hooks/dnd';

import { useMenuStore } from '../../stores/menu-store';

import cn from 'classnames';

type Props<T> = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  multiSort: boolean;
  dragOptions?: BeastGridConfig<T>['dragOptions'];
  events?: HeaderEvents;
};

export default function HeaderCell<T>({ levelIdx, idx, height, column, dragOptions, multiSort, events }: Props<T>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const lastX = useRef<number>(0);
  const pointerPosition = useRef<Coords>({ x: 0, y: 0 });
  const lastHitElement = useRef<HTMLElement | null>(null);
  const [columns, hideColumn, swapColumns, resizeColumn, container, changeSort] = useBeastStore(
    (state) => [
      state.columns,
      state.hideColumn,
      state.swapColumns,
      state.resizeColumn,
      state.container,
      state.changeSort,
    ]
  );
  const [dropTargets] = useDndStore((state) => [state.dropTargets]);
  const [menuColumn, initializeMenu, setMenuColumn] = useMenuStore((state) => [
    state.column,
    state.initializeState,
    state.setColumn,
  ]);
  const [drag] = useDndHook(
    { id: column.id, text: column.headerName, isInside: true },
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
    { id: column.id, hidePreview: true },
    {
      ...dragOptions,
      onAnimationFrame: handleResize,
      onDragEnd: () => (lastX.current = 0),
    }
  );

  function onDragStart() {
    lastX.current = 0;
    lastHitElement.current = null;
    setMenuColumn(undefined);
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

      if (hit && lastHitElement.current !== element) {
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
      
      if (events?.onDropOutside.hide) {
        hideColumn(column.id);
      }

      if (events?.onDropOutside.callback) {
        events.onDropOutside.callback(column);
      }
    }
  }

  const handleChangeSort = () => {
    if (column.sortable === false || !column.final) return;

    changeSort(column.id, !!multiSort);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuColumn === column.id) {
      setMenuColumn(undefined);
      return;
    }
    const rect = menuRef.current?.getBoundingClientRect();
    initializeMenu({
      column: column.id,
      coords: { x: rect?.left || 0, y: (rect?.bottom || 0) + 12 },
      clipRef: menuRef.current,
    });
  };

  const renderSortIcon = (sort: SortState) => {
    return (
      <div className="bg-sort-icon row middle">
        {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        {sort.priority > 0 && <span className="bg-sort-priority">{sort.priority}</span>}
      </div>
    );
  };

  if (column.hidden || column.logicDelete) return null;

  const RightSide = () => {
    if (column.menu) {
      return (
        <div className="bg-grid-header__cell__menu row middle" ref={menuRef}>
          <Menu
            className={cn('bg-grid-header__menu', menuColumn === column.id && 'active')}
            onClick={handleMenuClick}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="bg-grid-header__cell row middle between"
      key={`${levelIdx}-${idx}-${column.id}`}
      style={{
        height,
        width: column.width,
        left: column.left
      }}
      ref={drag}
      id={column.id}
      data-name={column.headerName}
      data-level={column.level}
      data-clone={column.original}
      onClick={handleChangeSort}
    >
      <div className="bg-grid-header__cell__left row middle" style={{ width: column.width }}>
        <span className="bg-grid-header-drop bg-grid-header__cell__name">{column.headerName}</span>
        {column.sort && renderSortIcon(column.sort)}
      </div>

      <div className="bg-grid-header__cell__menu row middle" ref={menuRef}>
        <RightSide />
      </div>

      <div ref={resize} className="bg-grid-header__resize" />
    </div>
  );
}
