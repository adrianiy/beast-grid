import Chart from './chart';
import { BeastGridConfig, BeastMode, Column, Data } from './common';
import Grid from './grid';
import { useBeastStore } from './stores/beast-store';

type Props<T> = {
    config: BeastGridConfig<T>;
    defaultConfig: Partial<BeastGridConfig<T>>;
    theme: string;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Beast<T>(props: Props<T>) {
    const [mode] = useBeastStore((state) => [state.mode]);

    if (mode === BeastMode.GRID) {
        return <Grid {...props} />;
    } else if (mode === BeastMode.CHART) {
        return <Chart visible {...props} />;
    } else {
        return null;
    }
}
