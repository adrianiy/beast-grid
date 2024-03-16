import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import { LineChart, BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';

import { useBeastStore } from './stores/beast-store';
import { getCategories, getSeries, groupByMultiple } from './utils/functions';
import { BeastGridConfig } from './common';
import deepmerge from 'deepmerge';
import { EChartsCoreOption } from 'echarts';

echarts.use([LineChart, BarChart, CanvasRenderer, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

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
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: valueColumns[0]?.formatter,
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
