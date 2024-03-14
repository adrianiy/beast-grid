import { Column, ColumnId, ColumnStore, Row, RowConfig } from './../../common/interfaces';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import cn from 'classnames';
import { LEVEL_PADDING } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

function getProperty<Type, Key extends keyof Type>(
  obj: Type,
  level: number,
  columnDef: Column,
  columns: ColumnStore,
  groupOrder: ColumnId[]
): string {
  let field = columnDef.field;

  if (columnDef.tree) {
    field = columns[groupOrder[level]]?.field || field;
  }
  const value = obj[field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

type Props = {
  idx: number;
  height: number;
  row: Row;
  border?: boolean;
  columnDef: Column;
  config?: Partial<RowConfig>;
  level: number;
  groupOrder: ColumnId[];
  columns: ColumnStore;
};
export function RowCell({ height, row, idx, columnDef, border, config, level, groupOrder, columns }: Props) {
  const [selectedCells, setSelectedStart, setSelectedEnd, selecting, setSelecting] = useBeastStore((state) => [
    state.selectedCells,
    state.setSelectedStart,
    state.setSelectedEnd,
    state.selecting,
    state.setSelecting
  ]);
  const inY = selectedCells && idx >= selectedCells.start.y && idx <= selectedCells.end.y;
  const inX = selectedCells && columnDef.finalPosition >= selectedCells.start.x && columnDef.finalPosition <= selectedCells.end.x;
  const selected = inY && inX;
  const borderTop = idx === selectedCells?.start.y;
  const borderLeft = columnDef.finalPosition === selectedCells?.start.x;
  const borderBottom = idx === selectedCells?.end.y;
  const borderRight = columnDef.finalPosition === selectedCells?.end.x;
  const value = getProperty(row, level, columnDef, columns, groupOrder);

  if (columnDef.hidden) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      return;
    }
    if (e.button === 2 && selected) {
      e.preventDefault();
      e.stopPropagation()
      return;
    }
    setSelectedStart({ x: columnDef.finalPosition, y: idx });
    setSelecting(true);
  };

  const handleMouseEnter = () => {
    if (selecting) {
      setSelectedEnd({ x: columnDef.finalPosition, y: idx });
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    const coords = { x: columnDef.finalPosition, y: idx };
    if (e.shiftKey) {
      setSelectedEnd(coords);
    }
  }
  
  const Chevron = () => {
    if (!row.children || !columnDef.rowGroup || (groupOrder[level] !== columnDef.id && !columnDef.tree)) {
      return null;
    }

    if (level === groupOrder.length && row.children?.length === 1) {
      return null;
    }

    return <ChevronRightIcon className={cn(!!row._expanded && 'active')} />;
  };

  return (
    <div
      data-hidden={columnDef.hidden}
      className={cn('grid-row-cell', {
        lastPinned: columnDef.lastPinned,
        expandable: row.children || columnDef.rowGroup,
        bordered: border,
        selected,
        borderTop,
        borderLeft,
        borderBottom,
        borderRight,
      })}
      style={{
        height,
        left: columnDef.left,
        paddingLeft:
          LEVEL_PADDING +
          (columnDef.tree ? LEVEL_PADDING * level : 0) +
          (columnDef.tree && !row.children ? LEVEL_PADDING : 0),
        width: columnDef.width,
      }}
      onClick={handleMouseClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      
    >
      <Chevron />
      <div
        className="grid-row-value"
        style={{
          display:
            config?.groups?.showChildName || !columnDef.rowGroup || row.children?.length || columnDef.tree
              ? 'flex'
              : 'none',
        }}
      >
        {value}
      </div>
    </div>
  );
}
