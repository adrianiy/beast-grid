import { ArrowUpward, ArrowDownward, Menu } from '@mui/icons-material';
import { BeastGridConfig, Column, ColumnStore, HeaderDrag, SortConfig } from './../../common/interfaces';
import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from './../../stores/dnd-store/dnd-hook';
import { useRef, useState } from 'react';
import { Coords } from '../../stores/dnd-store/store';
import HeaderMenu from './menu';

import cn from 'classnames';

type Props = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  multiSort: boolean;
  columnDefs: ColumnStore;
  dragOptions?: BeastGridConfig['dragOptions'];
};

export default function HeaderCell({ levelIdx, idx, height, column, columnDefs, dragOptions, multiSort }: Props) {
  const lastX = useRef<number>(0);
  const lastHitElement = useRef<HTMLElement | null>(null);
  const [menu, toggleMenu] = useState(false);
  const [hideColumn, swapColumns, resizeColumn, container, changeSort] = useBeastStore((state) => [
    state.hideColumn,
    state.swapColumns,
    state.resizeColumn,
    state.container,
    state.changeSort
  ]);
  const [pointer, dropTargets] = useDndStore((state) => [state.pointer, state.dropTargets]);
  const [drag] = useDndHook<HeaderDrag>(
    { id: column.id, text: column.headerName, isInside: true },
    {
      ...dragOptions,
      isDropTarget: true,
      onDragStart: () => (lastHitElement.current = null),
      onDirectionChange: () => (lastHitElement.current = null),
      onAnimationFrame: hitTest,
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
    toggleMenu(!menu);
  }

  const renderSortIcon = (sort: SortConfig) => {
    return (
      <div className="bg-sort-icon row middle">
        {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        {sort.priority > 0 && <span className="bg-sort-priority">{sort.priority}</span>}
      </div>
    );
  };

  const renderMenu = () => {
    if (!menu) return null;

    return <HeaderMenu column={column} multiSort={multiSort} />;
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
      <div className="bg-grid-header__cell__name row middle" data-name={column.headerName} id={column.id} ref={drag}>
        <span className="bg-grid-header-drop">{column.headerName}</span>
        {column.sort && renderSortIcon(column.sort)}
      </div>

      <div className="bg-grid-header__cell__menu row middle">
        {column.filterType && <Menu className={cn("bg-grid-header__menu", menu && 'active')} onClick={handleMenuClick} />}
        {renderMenu()}
      </div>

      <div ref={resize} className="bg-grid-header__resize" />
    </div>
  );
}
