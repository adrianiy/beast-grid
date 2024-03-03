import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column } from '../../common/interfaces';

import cls from 'classnames';

import './header.scss';
import { HeaderEvents, PinType } from '../../common';
import HeaderSection from './headerSection';

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

    return (
        <div className="grid-header row" style={{ height: height * levels.length, width: totalWidth }}>
            <HeaderSection
                width={leftWidth}
                height={height}
                headers={levels}
                pinType={PinType.LEFT}
                border={border}
                multiSort={multiSort}
                dragOptions={dragOptions}
                events={events}
            />
            <HeaderSection
                width={totalWidth - leftWidth - rightWidth}
                height={height}
                headers={levels}
                pinType={PinType.NONE}
                border={border}
                multiSort={multiSort}
                dragOptions={dragOptions}
                events={events}
            />
            <HeaderSection
                width={rightWidth}
                height={height}
                headers={levels}
                pinType={PinType.RIGHT}
                border={border}
                multiSort={multiSort}
                dragOptions={dragOptions}
                events={events}
            />
        </div>
    );
}
