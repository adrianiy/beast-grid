import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column } from '../../common/interfaces';

import cls from 'classnames';

import './header.scss';
import { PinType } from '../../common';

export default function Header<T>({
  height,
  border,
  multiSort,
  dragOptions,
}: {
  height: number;
  border?: boolean;
  multiSort?: boolean;
  dragOptions?: BeastGridConfig<T>['dragOptions'];
}) {
  const [columns] = useBeastStore((state) => [state.columns]);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  const totalWidth = Math.max(...levels.map(level => level.reduce((acc, curr) => acc + curr.width, 0)));

  const renderHeaderRow = (level: Column[], levelIdx: number, pinType: PinType | undefined) => {
    return level.filter(column => column.pinned === pinType).map((column, idx) => (
      <HeaderCell
        key={idx}
        levelIdx={0}
        idx={idx}
        multiSort={!!multiSort}
        height={height + (!column.children ? height * (levels.length - levelIdx - 1) : 0)}
        column={column}
        dragOptions={dragOptions}
      />
    ));
  }

  return (
    <div className="grid-header row between" style={{ height: height * levels.length, width: totalWidth }}>
      {levels.map((level, levelIdx) => (
        <div className={cls("grid-header-row row", { bordered: border })} style={{ height }} key={levelIdx}>
          <div className="grid-left-pin">{renderHeaderRow(level, levelIdx, PinType.LEFT)}</div>
          {renderHeaderRow(level, levelIdx, undefined)}
        </div>
      ))}
    </div>
  );
}
