import { useEffect, useState } from 'react';
import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column } from '../../common/interfaces';
import { HeaderEvents, MIN_COL_WIDTH, PinType } from '../../common';
import { groupBy } from '../../utils/functions';

import HeaderSection from './header-section';
import { v4 as uuidv4 } from 'uuid';

import './header.scss';

type Props<T> = {
    height: number;
    border?: boolean;
    multiSort?: boolean;
    dragOptions?: BeastGridConfig<T>['dragOptions'];
    events?: Partial<HeaderEvents>;
};

export default function Header<T>({ height, border, multiSort, dragOptions, events }: Props<T>) {
    const [columns, pivot, data] = useBeastStore((state) => [state.columns, state.pivot, state.data]);
    const [levels, setLevels] = useState<Column[][]>([]);

    useEffect(() => {
        let _levels: Column[][] = [];

        if (pivot?.columns) {
            pivot?.columns.forEach((column) => {
                const groupedData = groupBy(data, column, []);
                const values = groupedData.map((row) => row[column.field as string]);

                // convert values to columnDefs

                const columns: Column[] = values.map((value, idx) => {
                    return {
                        id: uuidv4(),
                        position: idx,
                        idx,
                        level: 0,
                        final: true,
                        headerName: `${value}`,
                        field: `${value}`,
                        width: MIN_COL_WIDTH,
                        pinned: PinType.NONE,
                        finalPosition: idx,
                        top: 0,
                        left: idx * MIN_COL_WIDTH
                    };
                });
                console.log("columns", columns);

                _levels.push(columns);
            });
        } else {
            _levels = Object.values(columns).reduce((acc, column) => {
                const level = column.level || 0;
                acc[level] = acc[level] || [];
                acc[level].push(column);
                return acc;
            }, [] as Column[][]);
        }

        setLevels(_levels);
    }, [columns, pivot, data]);

    if (!levels.length) return null;


    const levelZero = levels[0].filter((column) => !column.hidden);

    const totalWidth = levelZero.reduce((acc, curr) => acc + curr.width, 0);
    const leftWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0);
    const rightWidth = levelZero.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0);

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
