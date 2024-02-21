import { Column, Row } from '../../common';
import { RowCell } from './row-cell';

type Props = {
  row: Row;
  columns: Column[];
  idx: number;
  border: boolean;
  height: number;
  gap: number;
  level: number;
  onClick?: (row: Row, idx: number) => () => void;
};

const LEVEL_PADDING = 24;

export default function RowContainer({ row, columns, idx, border, height, gap, level, onClick }: Props) {
  const getClass = () => {
    return `grid-row ${border ? 'bordered' : ''}`;
  };
  
  return (
    <div
      key={idx}
      className={getClass()}
      style={{ top: (height * idx) + gap, height }}
      onClick={onClick?.(row, idx)}
    >
      {columns?.map((column, idx) => (
        <RowCell key={idx} idx={idx} height={height} row={row} columnDef={column} leftPadding={level && idx === 0 ? LEVEL_PADDING : 0} />
      ))}
    </div>
  );
}
