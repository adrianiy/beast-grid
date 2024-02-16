import { useRef } from 'react';

import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column } from '../../common/interfaces';

import './header.scss';

export default function Header({
  height,
  multiSort,
  dragOptions,
}: {
  height: number;
  multiSort?: boolean;
  dragOptions?: BeastGridConfig['dragOptions'];
}) {
  const dragBounds = useRef(null);

  const [columns] = useBeastStore((state) => [state.columns]);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  return (
    <div ref={dragBounds} className="grid-header row between" style={{ height: height * levels.length }}>
      {levels.map((level, levelIdx) => (
        <div className="grid-header-row row" style={{ height }} key={levelIdx}>
          {level.map((column, idx) => (
            <HeaderCell
              key={idx}
              levelIdx={levelIdx}
              idx={idx}
              multiSort={!!multiSort}
              height={height}
              column={column}
              columnDefs={columns}
              dragOptions={dragOptions}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
