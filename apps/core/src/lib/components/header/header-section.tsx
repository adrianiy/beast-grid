import { BeastGridConfig, Column, HeaderEvents, PinType } from '../../common';

import HeaderCell from './cell';

import cn from 'classnames';

type Props<T> = {
    width: number;
    height: number;
    headers: Column[][];
    leftEdge?: number;
    rightEdge?: number;
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
    leftEdge,
    rightEdge,
    pinType,
    multiSort,
    dragOptions,
    events,
    headers,
}: Props<T>) {
    const getColumnSlice = (columns: Column[]) => {
        if (leftEdge || rightEdge) {
            const leftIndex = columns.findIndex((column) => column.left >= (leftEdge || 0));
            const rightIndex = columns.findIndex((column) => column.left > (rightEdge || 0));

            return [Math.max(0, leftIndex - 4), rightIndex > -1 ? rightIndex + 4 : Infinity];
        }

        return [0, columns.length];
    };
    const HeaderRow = ({ level, levelIdx }: { level: Column[]; levelIdx: number }) => {
        const [init, end] = getColumnSlice(level);

        return (
            <div className={cn('grid-header-row row', { border })} style={{ height, width }} key={levelIdx}>
                {level.map((column, idx) => {
                    if (column.finalPosition >= end || column.finalPosition < init) {
                        return null;
                    }
                    if (column.pinned !== pinType || column.hidden) {
                        return null;
                    }

                    return (
                        <HeaderCell
                            key={idx}
                            levelIdx={levelIdx}
                            idx={idx}
                            multiSort={!!multiSort}
                            height={height}
                            headers={headers}
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
