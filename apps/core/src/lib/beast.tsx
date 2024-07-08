import { Fragment, useEffect } from 'react';
import Chart from './chart';
import { BeastGridConfig, BeastMode, Column, Data } from './common';
import Grid from './grid';
import { useBeastStore } from './stores/beast-store';

type Props<T> = {
    config: BeastGridConfig<T>;
    defaultConfig: Partial<BeastGridConfig<T>>;
    theme: string;
    disableColumnSwap?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Beast<T>(props: Props<T>) {
    const [mode, initialized, setInitialPivot] = useBeastStore((state) => [state.mode, state.initialized, state.setInitialPivot]);

    useEffect(() => {
        if (initialized) {
            if (props.config.pivot?.pivotConfig) {
                setInitialPivot(props.config.pivot.pivotConfig);
            }
        }
    }, [initialized, props.config.pivot?.pivotConfig, setInitialPivot])

    return <Fragment>
        {mode === BeastMode.GRID && <Grid {...props} />}
        <Chart visible={mode === BeastMode.CHART} {...props} />
    </Fragment>
}
