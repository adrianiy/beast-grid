import { BeastGridConfig, Column, HeaderEvents, PinType } from '../../common';

import HeaderCell from './cell';

import cn from 'classnames';

type Props<T> = {
    leftWidth?: number;
    width: number;
    height: number;
    headers: Column[][];
    pinType?: PinType;
    border?: boolean;
    multiSort?: boolean;
    fullWidth?: boolean;
    dragOptions?: BeastGridConfig<T>['dragOptions'];
    events?: Partial<HeaderEvents>;
    disableSwapColumns?: boolean;
};

function HeaderRow<T>({ level, levelIdx, fullWidth, border, height, width, pinType, multiSort, headers, dragOptions, events, disableSwapColumns, leftWidth }: { level: Column[]; levelIdx: number } & Props<T>) {
    return (
        <div className={cn('grid-header-row row', { border: border && !fullWidth })} style={{ height, width: fullWidth ? '100%' : width }} key={levelIdx}>
            {level.map((column, idx) => {
                const inView = column.pinned !== PinType.NONE || column.inView;

                if (column.pinned !== pinType || column.hidden || !inView) {
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
                        disableSwapColumns={disableSwapColumns}
                        leftWidth={leftWidth}
                    />
                );
            })}
            {fullWidth && <div className="grid-header-separator" />}
        </div>
    );
}

export default function HeaderSection<T>(props: Props<T>) {
    if (!props.width) {
        return null;
    }

    return (
        <div className={cn('grid-header-content', `grid-${props.pinType}-pin`)} style={{ width: props.fullWidth ? '100%' : 'auto' }}>
            {props.headers.map((level, idx) => HeaderRow({ ...props, level, levelIdx: idx }))}
        </div>
    );
}
