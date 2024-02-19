import { ArrowUpward, ArrowDownward, Menu } from '@mui/icons-material';
import { BeastGridConfig, Column, ColumnStore, Coords, HeaderDrag, SortConfig } from './../../common/interfaces';
import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useRef } from 'react';
import { useDndHook } from '../../hooks/dnd';

import { useMenuStore } from '../../stores/menu-store';

import cn from 'classnames';

type Props<T> = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  multiSort: boolean;
  columnDefs: ColumnStore;
  dragOptions?: BeastGridConfig<T>['dragOptions'];
};

export default function HeaderCell<T>({ levelIdx, idx, height, column, columnDefs, dragOptions, multiSort }: Props<T>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const lastX = useRef<number>(0);
  const lastHitElement = useRef<HTMLElement | null>(null);
  const [hideColumn, swapColumns, resizeColumn, container, changeSort] = useBeastStore((state) => [
    state.hideColumn,
    state.swapColumns,
    state.resizeColumn,
    state.container,
    state.changeSort,
  ]);
  const [pointer, dropTargets] = useDndStore((state) => [state.pointer, state.dropTargets]);
  const [menuColumn, initializeMenu, setMenuColumn] = useMenuStore((state) => [
    state.column,
    state.initializeState,
    state.setColumn,
  ]);
  const [drag] = useDndHook<HeaderDrag>(
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

  function hitTest(pointer: Coords) {
    for (const element of dropTargets) {
      if (!element || element.id === column.id) continue;

      const { left, right } = element.getBoundingClientRect();
      const { x } = pointer;
      const hit = x > left && x < right;

      if (hit && element !== lastHitElement.current) {
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
      const newWidth = columnDefs[column.id].width + delta;

      lastX.current = pointer.x;

      resizeColumn(column.id, newWidth);
    }
  }

  function onDragEnd() {
    if (pointer.x < 0 || pointer.y < 0) {
      lastHitElement.current = null;
      hideColumn(column.id);
    }
  }

  const handleChangeSort = () => {
    if (column.sortable === false) return;

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

  const renderSortIcon = (sort: SortConfig) => {
    return (
      <div className="bg-sort-icon row middle">
        {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        {sort.priority > 0 && <span className="bg-sort-priority">{sort.priority}</span>}
      </div>
    );
  };

  if (column.hidden) return null;

  return (
    <div
      className="bg-grid-header__cell row middle between"
      key={`${levelIdx}-${idx}-${column.id}`}
      style={{
        top: height * levelIdx,
        height,
        width: columnDefs[column.id].width,
        left: columnDefs[column.id].left,
      }}
      onClick={handleChangeSort}
    >
      <div
        className="bg-grid-header__cell__name row middle"
        data-name={column.headerName}
        id={column.id}
        ref={drag}
      >
        <span className="bg-grid-header-drop">{column.headerName}</span>
        {column.sort && renderSortIcon(column.sort)}
      </div>

      <div className="bg-grid-header__cell__menu row middle" ref={menuRef}>
        {column.menu && (
          <Menu
            className={cn('bg-grid-header__menu', menuColumn === column.id && 'active')}
            onClick={handleMenuClick}
          />
        )}
      </div>

      <div ref={resize} className="bg-grid-header__resize" />
    </div>
  );
}
