import { BeastGridConfig, Column, HeaderEvents, PinType } from '../../common';

import cn from 'classnames';
import HeaderCell from './cell';

type Props<T> = {
  width: number;
  height: number;
  headers: Column[][];
  pinType?: PinType;
  border?: boolean;
  multiSort?: boolean;
  dragOptions?: BeastGridConfig<T>['dragOptions'];
  events?: Partial<HeaderEvents>;
};

export default function HeaderSection<T>({
  width,
  height,
  border,
  pinType,
  multiSort,
  dragOptions,
  events,
  headers,
}: Props<T>) {
  const HeaderRow = ({ level, levelIdx }: { level: Column[]; levelIdx: number }) => {
    return (
      <div className={cn('grid-header-row row', { border })} style={{ height, width }} key={levelIdx}>
        {level.map((column, idx) => {
          if (column.pinned !== pinType) {
            return null;
          }
          return (
            <HeaderCell
              key={idx}
              levelIdx={0}
              idx={idx}
              multiSort={!!multiSort}
              height={height + (!column.children ? height * (headers.length - levelIdx - 1) : 0)}
              column={column}
              dragOptions={dragOptions}
              events={events}
            />
          );
        })}
      </div>
    );
  };

  if (!width) {
    return null;
  }

  return (
    <div className={cn('grid-header-content', `grid-${pinType}-pin`)}>
      {headers.map((level, idx) => HeaderRow({ level, levelIdx: idx }))}
    </div>
  );
}
