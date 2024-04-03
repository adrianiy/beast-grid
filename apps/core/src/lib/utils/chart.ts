import { ChartType, Column, Data } from '../common';

export const getDateSeriesConfig = (chartSeries: Column[], source: Data, chartType: ChartType) => {
    const isLine = chartType === ChartType.LINE;
    const isPie = chartType === ChartType.PIE;

    return chartSeries.map((column, idx) => ({
        name: column.field,
        data: source.map((row, idx) => ({
            value: row[column.field as string] || null,
            name: row.date,
            itemStyle: isLine && {
                opacity: source[idx + 1]?.[column.field as string] ? 0 : 1,
            },
        })),
        radius: isPie && [`${70 - idx * 20}%`, `${70 - idx * 20 + 10}%`],
        tooltip: {
            valueFormatter: column.formatter,
        },
        emphasis: {
            focus: 'series',
        },
        label: {
            show: false,
        },
        labelLine: {
            show: false,
        },
        type: chartType,
        smooth: true,
    }));
};

export const getBaseSeriesConfig = (series: Column[], isPie: boolean, chartType: ChartType) => {
    return series.map((column, idx) => ({
        name: column.headerName,
        radius: isPie && [`${70 - idx * 20}%`, `${70 - idx * 20 + 10}%`],
        tooltip: {
            valueFormatter: column.formatter,
        },
        emphasis: {
            focus: 'series',
        },
        label: {
            show: false,
        },
        labelLine: {
            show: false,
        },
        type: chartType,
        smooth: true,
    }));
};
