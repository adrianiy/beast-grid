import { Fragment } from 'react';
import Chart from './chart';
import { BeastGridConfig, BeastMode, Column, Data } from './common';
import Grid from './grid';
import { useBeastStore } from './stores/beast-store';

type Props<T> = {
    config: BeastGridConfig<T>;
    defaultConfig: Partial<BeastGridConfig<T>>;
    theme: string;
    disaleColumnSwap?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
    onRowClick?: (row: T) => void;
};

export default function Beast<T>(props: Props<T>) {
    const [mode] = useBeastStore((state) => [state.mode]);

    return <Fragment>
        {mode === BeastMode.GRID && <Grid {...props} />}
        <Chart visible={mode === BeastMode.CHART} {...props} />
    </Fragment>
}
