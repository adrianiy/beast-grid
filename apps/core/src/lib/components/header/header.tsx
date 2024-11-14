import { BeastGridConfig, Column } from '../../common/interfaces';
import { HeaderEvents, PinType } from '../../common';

import HeaderSection from './header-section';

import './header.scss';

type Props<T> = {
    height: number;
    levels: Column[][];
    border?: boolean;
    multiSort?: boolean;
    dragOptions?: BeastGridConfig<T>['dragOptions'];
    events?: Partial<HeaderEvents>;
    disableSwapColumns?: boolean;
    fullWidth?: boolean;
};

export default function Header<T>({ height, levels, border, multiSort, fullWidth, dragOptions, events, disableSwapColumns }: Props<T>) {
    if (!levels.length) return null;

    const levelZero = levels[0].filter((column) => !column.hidden);

    const totalWidth = levelZero.reduce((acc, curr) => acc + curr.width, 0);
    const leftWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0);
    const rightWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0);

    return (
        <div className="grid-header row" style={{ height: height * levels.length, width: fullWidth ? '100%' : totalWidth }}>
            <HeaderSection
                width={leftWidth}
                totalWidth={totalWidth}
                height={height}
                headers={levels}
                pinType={PinType.LEFT}
                border={border}
                multiSort={multiSort}
                fullWidth={fullWidth}
                dragOptions={dragOptions}
                disableSwapColumns={disableSwapColumns}
                events={events}
            />
            <HeaderSection
                leftWidth={leftWidth}
                totalWidth={totalWidth}
                width={totalWidth - leftWidth - rightWidth}
                height={height}
                headers={levels}
                pinType={PinType.NONE}
                border={border}
                multiSort={multiSort}
                fullWidth={fullWidth}
                dragOptions={dragOptions}
                events={events}
                disableSwapColumns={disableSwapColumns}
            />
            <HeaderSection
                width={rightWidth}
                totalWidth={totalWidth}
                height={height}
                headers={levels}
                pinType={PinType.RIGHT}
                border={border}
                multiSort={multiSort}
                fullWidth={fullWidth}
                dragOptions={dragOptions}
                events={events}
                disableSwapColumns={disableSwapColumns}
            />
        </div>
    );
}
