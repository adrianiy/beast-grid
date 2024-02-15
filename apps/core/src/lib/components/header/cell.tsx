import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import {
  Column,
  ColumnStore,
  HeaderDrag,
  SortConfig,
} from './../../common/interfaces';
import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from './../../stores/dnd-store/dnd-hook';
import { useRef } from 'react';

type Props = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  columnDefs: ColumnStore;
  changeSort: (column: Column) => () => void;
};

export default function HeaderCell({
  levelIdx,
  idx,
  height,
  column,
  columnDefs,
  changeSort,
}: Props) {
  const lastX = useRef<number>(0);
  const [hideColumn, swapColumns, resizeColumn, container] = useBeastStore(
    (state) => [
      state.hideColumn,
      state.swapColumns,
      state.resizeColumn,
      state.container,
    ]
  );
  const [pointer, direction] = useDndStore((state) => [
    state.pointer,
    state.direction,
  ]);
  const [drag] = useDndHook<HeaderDrag>(
    { id: column.id, text: column.headerName, isInside: true },
    {
      onDrag,
      onDragEnd,
    },
    container
  );
  const [resize] = useDndHook(
    { id: column.id, hidePreview: true },
    {
      onDrag: handleResize,
      onDragEnd: () => (lastX.current = 0), 
    }
  );

  function handleResize(e: DragEvent) {
    if (lastX.current === 0) {
      lastX.current = e.clientX;
    }

    const delta = e.clientX - lastX.current;

    if (delta && Math.abs(delta) > 20) {
      const newWidth = columnDefs[column.id].width + delta;

      lastX.current = e.clientX;

      resizeColumn(column.id, newWidth);
    }
  }

  function onDragEnd() {
    if (pointer.x < 0 || pointer.y < 0) {
      hideColumn(column.id);
    }
  }

  function onDrag() {
    if (pointer.x  && pointer.y) {
      const x = pointer.x + container.scrollLeft;
      
      let swappableColumn: Column | undefined = undefined;

      if (direction === 'right') {
        swappableColumn = Object.values(columnDefs).find(
          (c) =>
            c.left > columnDefs[column.id].left &&
            !c.hidden &&
            x < c.left + c.width &&
            x > c.left
        )
      } else if (direction === 'left') {
        swappableColumn = Object.values(columnDefs).findLast(
          (c) =>
            c.left < columnDefs[column.id].left &&
            !c.hidden &&
            x >= c.left &&
            x <= c.left + c.width
        );
      }

      if (swappableColumn) {
        swapColumns(column.id, swappableColumn.id);
      }
    }
  }

  const renderSortIcon = (sort: SortConfig) => {
    return (
      <div className="sort-icon row middle">
        {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        {sort.priority > 0 && (
          <span className="sort-priority">{sort.priority}</span>
        )}
      </div>
    );
  };

  if (column.hidden) return null;

  return (
    <div
      className="grid-header-cell row middle between"
      key={`${levelIdx}-${idx}-${column.id}`}
      style={{
        top: height * levelIdx,
        height,
        width: columnDefs[column.id].width,
        left: columnDefs[column.id].left,
      }}
      onClick={changeSort(column)}
    >
      <div className="grid-header-name row middle" ref={drag}>
        <span className="grid-header-drop">{column.headerName}</span>
        {column.sort && renderSortIcon(column.sort)}
      </div>
      <div ref={resize} className="grid-header-resize" />
    </div>
  );
}
