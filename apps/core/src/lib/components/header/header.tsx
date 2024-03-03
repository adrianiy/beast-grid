import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column } from '../../common/interfaces';

import cls from 'classnames';

import './header.scss';
import { HeaderEvents, PinType } from '../../common';

type Props<T> = {
    height: number;
    border?: boolean;
    multiSort?: boolean;
    dragOptions?: BeastGridConfig<T>['dragOptions'];
    events?: Partial<HeaderEvents>;
};

export default function Header<T>({ height, border, multiSort, dragOptions, events }: Props<T>) {
    const [columns] = useBeastStore((state) => [state.columns]);

    const levels = Object.values(columns).reduce((acc, column) => {
        const level = column.level || 0;
        acc[level] = acc[level] || [];
        acc[level].push(column);
        return acc;
    }, [] as Column[][]);

    const totalWidth = Math.max(...levels.map((level) => level.reduce((acc, curr) => acc + curr.width, 0)));
    const leftWidth = Math.max(
        ...levels.map((level) => level.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0))
    );
    const rightWidth = Math.max(
        ...levels.map((level) => level.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0))
    );

    const renderHeaderRow = (level: Column[], levelIdx: number, pinType: PinType | undefined) => {
        return level
            .filter((column) => column.pinned === pinType)
            .map((column, idx) => (
                <HeaderCell
                    key={idx}
                    levelIdx={0}
                    idx={idx}
                    multiSort={!!multiSort}
                    height={height + (!column.children ? height * (levels.length - levelIdx - 1) : 0)}
                    column={column}
                    dragOptions={dragOptions}
                    events={events}
                />
            ));
    };

    const renderLevels = (width: number, pinType?: PinType) => {
        return levels.map((level, levelIdx) => (
            <div className={cls('grid-header-row row', { bordered: border })} style={{ height, width }} key={levelIdx}>
                {renderHeaderRow(level, levelIdx, pinType)}
            </div>
        ));
    };

    return (
        <div className="grid-header row" style={{ height: height * levels.length, width: totalWidth }}>
            {leftWidth > 0 && (
                <div className="grid-left-pin" style={{ width: leftWidth }}>
                    {renderLevels(leftWidth, PinType.LEFT)}
                </div>
            )}
            <div className="grid-header-content" style={{ width: totalWidth, transform: `translateX(-${leftWidth}px)` }}>
                {renderLevels(totalWidth - leftWidth - rightWidth)}
            </div>
            {rightWidth > 0 && (
                <div className="grid-right-pin" style={{ width: rightWidth }}>
                    {renderLevels(rightWidth, PinType.RIGHT)}
                </div>
            )}
        </div>
    );
}
