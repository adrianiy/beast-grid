import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import { LineChart, BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, ToolboxComponent } from 'echarts/components';

import { useBeastStore } from './stores/beast-store';
import { getCategories, getSeries, groupByMultiple } from './utils/functions';
import { BeastGridConfig } from './common';
import deepmerge from 'deepmerge';
import { EChartsCoreOption } from 'echarts';

echarts.use([
  LineChart,
  BarChart,
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
]);

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Chart<T>(props: Props<T>) {
  const [columns, data] = useBeastStore((state) => [state.sortedColumns, state.data]);

  const aggColumns = columns.filter((col) => col.aggregation);

  const categoryColumns = getCategories(columns, data, props.config.chart);

  const groupedData = groupByMultiple(data, categoryColumns, aggColumns);

  const valueColumns = getSeries(columns, groupedData, props.config.chart);

  const categories = groupedData.map((row) => row[categoryColumns.map((col) => col.headerName).join('_')] as string);

  const options: EChartsCoreOption = deepmerge(
    {
      grid: { right: 8 },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          magicType: {
            type: ['line', 'bar', 'stack'],
          },
          restore: {},
          myConfig: {
            show: true,
            title: 'Config',
            icon: `path://M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 5C3.01671 5 3.03323 4.99918 3.04952 4.99758C3.28022 6.1399 4.28967 7 5.5 7C6.71033 7 7.71978 6.1399 7.95048 4.99758C7.96677 4.99918 7.98329 5 8 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H8C7.98329 4 7.96677 4.00082 7.95048 4.00242C7.71978 2.86009 6.71033 2 5.5 2C4.28967 2 3.28022 2.86009 3.04952 4.00242C3.03323 4.00082 3.01671 4 3 4H1.5C1.22386 4 1 4.22386 1 4.5C1 4.77614 1.22386 5 1.5 5H3ZM11.9505 10.9976C11.7198 12.1399 10.7103 13 9.5 13C8.28967 13 7.28022 12.1399 7.04952 10.9976C7.03323 10.9992 7.01671 11 7 11H1.5C1.22386 11 1 10.7761 1 10.5C1 10.2239 1.22386 10 1.5 10H7C7.01671 10 7.03323 10.0008 7.04952 10.0024C7.28022 8.8601 8.28967 8 9.5 8C10.7103 8 11.7198 8.8601 11.9505 10.0024C11.9668 10.0008 11.9833 10 12 10H13.5C13.7761 10 14 10.2239 14 10.5C14 10.7761 13.7761 11 13.5 11H12C11.9833 11 11.9668 10.9992 11.9505 10.9976ZM8 10.5C8 9.67157 8.67157 9 9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5Z`,
            onclick: () => {
              console.log('Config');
            },
          },
        },
      },
      legend: {
        type: 'scroll',
        icon: 'circle',
        bottom: 0,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: valueColumns[0]?.formatter,
        padding: 16,
        extraCssText: 'border: var(--bg-border--1); border-radius: 0; box-shadow: none',
      },
      xAxis: {
        type: 'category',
        data: categories,
      },
      yAxis: {
        type: 'value',
      },
      series: valueColumns.map((column) => ({
        name: column?.headerName,
        data: groupedData.map((row) => row[column?.field as string]),
        type: props.config.chart?.defaultValues?.chartType ?? 'bar',
        smooth: true,
      })),
    },
    props.config.chart?.config ?? {}
  );

  return (
    <div className="bg-chart__container">
      <ReactEChartsCore
        echarts={echarts}
        option={options}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: props.config.style?.maxHeight ?? '100%', width: '100%' }}
      />
    </div>
  );
}
