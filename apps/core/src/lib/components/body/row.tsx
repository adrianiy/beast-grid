import { Column, PinType, Row } from '../../common';
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
  onClick?: (row: Row, idx: number) => () => void;
};

const LEVEL_PADDING = 32;

export default function RowContainer({ row, columns, idx, border, height, gap, level, onClick }: Props) {
  const totalWidth = columns.reduce((acc, curr) => acc + curr.width, 0);

  const renderRow = (pinType: PinType | undefined) => {
    return columns.filter(column => column.pinned === pinType).map((column, idx) => (
      <RowCell key={idx} height={height} row={row} columnDef={column} leftPadding={level && column.aggregationLevel ? LEVEL_PADDING : 0} />
    ));
  }
  
  return (
    <div
      key={idx}
      className={cn('grid-row', { bordered: border, expandable: row.children })}
      style={{ top: (height * idx) + gap, height, width: totalWidth }}
      onClick={onClick?.(row, idx)}
    >
      <div className="grid-left-pin">{renderRow(PinType.LEFT)}</div>
      {renderRow(undefined)}
    </div>
  );
}
