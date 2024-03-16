import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import { LineChart, BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';

import { useBeastStore } from "./stores/beast-store";
import { getCategories, getSeries, groupByMultiple } from "./utils/functions";
import { BeastGridConfig } from './common';

echarts.use([LineChart, BarChart, CanvasRenderer, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

type Props<T> = {
    config: BeastGridConfig<T>;
};

export default function Chart<T>(props: Props<T>) {
  const [columns, data] = useBeastStore((state) => [state.sortedColumns, state.data]);

  const aggColumns = columns.filter((col) => col.aggregation);

  const categoryColumns = getCategories(columns, data);

  const groupedData = groupByMultiple(data, categoryColumns, aggColumns)
  
  const valueColumns = getSeries(columns, groupedData);

  const categories = groupedData.map((row) => row[categoryColumns.map((col) => col.headerName).join('_')] as string);
  const seriesData = groupedData.map((row) => row[valueColumns[0]?.field as string]);
  

  const options: echarts.EChartsCoreOption = {
    grid: { top: 8, right: 8, bottom: 24, left: 36 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: valueColumns[0]?.formatter
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: valueColumns[0]?.headerName,
        data: seriesData,
        type: 'bar',
        smooth: true,
      },
    ],
  };

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
  )
}
