import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { Column, ColumnStore, HeaderDrag, SortConfig } from './../../common/interfaces';
import { useBeastStore } from './../../stores/beast-store';
import { useDndStore } from './../../stores/dnd-store';
import { useDndHook } from './../../stores/dnd-store/dnd-hook';

type Props = {
  levelIdx: number;
  idx: number;
  height: number;
  column: Column;
  columnDefs: ColumnStore;
  changeSort: (column: Column) => () => void;
};

let lastX = 0;

export default function HeaderCell({ levelIdx, idx, height, column, columnDefs, changeSort }: Props) {
  const [hideColumn, swapColumns, resizeColumn, container] = useBeastStore((state) => [
    state.hideColumn,
    state.swapColumns,
    state.resizeColumn,
    state.container,
  ]);
  const [dragItem, setDragItem] = useDndStore((state) => [state.dragItem, state.setDragItem]);
  const [drag] = useDndHook<HeaderDrag>(
    { id: column.id, text: column.headerName, isInside: true },
    {
      onDrag: () => handleDrag,
      onDrop: () => handleDrop,
    }
  );
  const [resize] = useDndHook(
    { id: column.id, hidePreview: true },
    {
      onDrag: () => handleResize,
      onDrop: () => handleResizeEnd,
    }
  );

  const handleDrop = () => {
    lastX = 0;

    if (!dragItem?.isInside) {
      hideColumn(column.id);
    }
  };

  const handleDrag = (e: DragEvent) => {
    const { left, right, top, bottom } = container.getBoundingClientRect();

    const checkInside = () => {
      const threshold = 50;

      const isInside =
        e.clientX > left - threshold &&
        e.clientX < right + threshold &&
        e.clientY > top - threshold &&
        e.clientY < bottom + threshold;

      if (dragItem) {
        setDragItem({ ...dragItem, isInside });
      }
    };

    if (e.clientX && e.clientX !== lastX) {
      const movingRight = lastX < e.clientX;
      const xInGrid = e.clientX - container.getBoundingClientRect().left;
      let swappableColumn: Column | undefined = undefined;

      lastX = e.clientX;

      if (movingRight) {
        swappableColumn = Object.values(columnDefs).find(
          (c) => c.left > columnDefs[column.id].left && xInGrid < c.left + c.width && xInGrid > c.left
        );
      } else {
        swappableColumn = Object.values(columnDefs).findLast(
          (c) => c.left < columnDefs[column.id].left && xInGrid >= c.left && xInGrid <= c.left + c.width
        );
      }

      if (swappableColumn) {
        swapColumns(column.id, swappableColumn.id);
      } else {
        checkInside();
      }
    }
  };

  const handleResize = (e: DragEvent) => {
    if (lastX === 0) {
      lastX = e.clientX;
    }
    
    const delta = e.clientX - lastX;
    
    if (Math.abs(delta) > 20) {
      const newWidth = columnDefs[column.id].width + delta;
      
      lastX = e.clientX;

      resizeColumn(column.id, newWidth);
    }
  };

  const handleResizeEnd = () => {
    lastX = 0;
  }

  const renderSortIcon = (sort: SortConfig) => {
    return (
      <div className="sort-icon row middle">
        {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        {sort.priority > 0 && <span className="sort-priority">{sort.priority}</span>}
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
