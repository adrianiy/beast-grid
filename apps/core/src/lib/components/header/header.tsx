import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { Column } from '../../common/interfaces';

import './header.scss';

export default function Header({
  height,
  multiSort,
}: {
  height: number;
  multiSort?: boolean;
}) {
  const [columns, changeSort] = useBeastStore((state) => [
    state.columns,
    state.changeSort,
  ]);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  const handleChangeSort = (column: Column) => () => {
    changeSort(column.id, multiSort);
  };

  return (
    <div
      className="grid-header row between"
      style={{ height: height * levels.length }}
    >
      {levels.map((level, levelIdx) => (
        <div className="grid-header-row row" style={{ height }} key={levelIdx}>
          {level.map((column, idx) => (
            <HeaderCell
              key={idx}
              levelIdx={levelIdx}
              idx={idx}
              height={height}
              column={column}
              columnDefs={columns}
              changeSort={handleChangeSort}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
