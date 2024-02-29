import { Column, PinType, Row, RowEvents } from '../../common';
import { RowCell } from './row-cell';

import cn from 'classnames';

type Props = {
  row: Row;
  columns: Column[];
  idx: number;
  border?: boolean;
  height: number;
  gap: number;
  level: number;
  events?: Partial<RowEvents>;
  onClick?: (row: Row, idx: number) => void;
};

const LEVEL_PADDING = 16;

export default function RowContainer({ row, columns, idx, border, height, gap, level, onClick, events }: Props) {
  const totalWidth = columns.reduce((acc, curr) => acc + curr.width, 0);

  const renderRow = (pinType: PinType | undefined) => {
    return columns.filter(column => column.pinned === pinType).map((column, idx) => (
      <RowCell key={idx} height={height} row={row} columnDef={column} paddingLeft={LEVEL_PADDING * (column.aggregationLevel ? level : 1)} />
    ));
  }

  const handleClick = () => {
    if (events?.onClick?.callback) {
      events.onClick.callback(row, idx);
    }

    if (onClick) {
      onClick(row, idx);
    }
  }
  
  return (
    <div
      key={idx}
      className={cn('grid-row', { bordered: border, expandable: row.children, withHighlight: events?.onHover?.highlight })}
      style={{ top: (height * idx) + gap, height, width: totalWidth }}
      onClick={handleClick}
    >
      <div className="grid-left-pin">{renderRow(PinType.LEFT)}</div>
      {renderRow(undefined)}
    </div>
  );
}
