import { BeastGridConfig, Column } from '../../common/interfaces';
import { HeaderEvents, PinType } from '../../common';

import HeaderSection from './header-section';

import './header.scss';
import { useBeastStore } from '../../stores/beast-store';

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
    const [container] = useBeastStore((state) => [state.container])
    if (!levels.length) return null;

    const levelZero = levels[0].filter((column) => !column.hidden);

    const totalWidth = levelZero.reduce((acc, curr) => acc + curr.width, 0);
    const leftWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0);
    const rightWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0);
    const fullFillWidth = container.clientWidth - leftWidth - rightWidth;

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
                disableSwapColumns={disableSwapColumns}
                events={events}
            />
            <HeaderSection
                leftWidth={leftWidth}
                width={totalWidth - leftWidth - rightWidth}
                fullWidth={fullWidth}
                totalWidth={fullFillWidth}
                height={height}
                headers={levels}
                pinType={PinType.NONE}
                border={border}
                multiSort={multiSort}
                dragOptions={dragOptions}
                events={events}
                disableSwapColumns={disableSwapColumns}
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
                disableSwapColumns={disableSwapColumns}
            />
        </div>
    );
}
