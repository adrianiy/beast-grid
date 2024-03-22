import { ChartType, Column, Data } from '../common';

export const getDateSeriesConfig = (chartSeries: Column[], source: Data, chartType: ChartType) => {
  const isLine = chartType === ChartType.LINE;
  const isPie = chartType === ChartType.PIE;

  
  return chartSeries.map((column, idx) => {
    const sourceSeries = source.filter((row) => row[column.field as string]);

    return {
      name: column.field,
      data: sourceSeries.map((row, idx) => ({
        value: row[column.field as string],
        name: row.date,
        itemStyle: isLine && {
          opacity: idx === sourceSeries.length - 1 ? 1 : 0,
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
    };
  });
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
