import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import { LineChart, BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, ToolboxComponent } from 'echarts/components';

import { useBeastStore } from './stores/beast-store';
import { getCategories, getSeries, groupByMultiple } from './utils/functions';
import { BeastGridConfig, ChartType, Column, Data, SideBarConfig } from './common';
import deepmerge from 'deepmerge';
import { EChartsCoreOption } from 'echarts';
import SideBar from './components/sidebar/sidebar';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import cn from 'classnames';

import './chart.scss';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { FormattedMessage } from 'react-intl';

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
  modal?: boolean;
  visible?: boolean;
  data?: Data;
  columns?: Column[];
  onClose?: () => void;
};

export default function Chart<T>(props: Props<T>) {
  const [columns, data, theme, setSidebar] = useBeastStore((state) => [
    state.sortedColumns,
    state.data,
    state.theme,
    state.setSideBarConfig,
  ]);

  if (!props.visible) {
    return null;
  }

  return props.modal ? (
    createPortal(
      <div className={cn('bg-chart__modal__container', theme)} onClick={props.onClose}>
        <div className="bg-chart__modal column" onClick={(e) => e.stopPropagation()}>
          <div className="bg-chart__modal__header row middle between">
            <div className="bg-chart__title">
              <FormattedMessage id="chart.title" />
            </div>
            <div className="bg-chart__modal__button row middle" onClick={() => setSidebar(SideBarConfig.CHART)}>
              <MixerHorizontalIcon />
              <FormattedMessage id="toolbar.chartConfig" defaultMessage="Chart Config" />
            </div>
          </div>
          <ChartWrapper config={props.config} columns={props.columns ?? columns} data={props.data ?? data} />
        </div>
      </div>,
      document.body
    )
  ) : (
    <ChartWrapper config={props.config} columns={props.columns ?? columns} data={props.data ?? data} />
  );
}

type WrapperProps<T> = {
  config: BeastGridConfig<T>;
  columns: Column[];
  data: Data;
};

const CUSTOM_CATEGORY = { id: 'custom_column', headerName: 'Custom Column', field: 'custom_column' } as Column;

function ChartWrapper<T>(props: WrapperProps<T>) {
  const { columns, data } = props;

  const categoryColumns = getCategories(columns, data);

  const userCategory = props.config.chart?.defaultValues?.categoryColumn
    ? categoryColumns.find((c) => c.id === props.config.chart?.defaultValues?.categoryColumn)
    : undefined;

  if (!userCategory) {
    categoryColumns.push(CUSTOM_CATEGORY);
  }

  const configurableSeries = getSeries(columns, data);

  const [category, setCategory] = useState<Column>(userCategory || CUSTOM_CATEGORY);
  const [series, setSeries] = useState<Column[]>(
    columns.filter((c) => props.config.chart?.defaultValues?.dataColumns?.includes(c.field as string))
  );
  const [chartType, setChartType] = useState<ChartType>(
    (props.config.chart?.defaultValues?.chartType ?? ChartType.BAR) as ChartType
  );

  const [options, setOptions] = useState<EChartsCoreOption>();

  useEffect(() => {
    const aggColumns = columns.filter((col) => col.aggregation);
    const groupedData =
      !category || category.id === 'custom_column'
        ? groupByMultiple(data, categoryColumns.slice(0, -1), aggColumns)
        : data;
    const field =
      !category || category.id === 'custom_column'
        ? categoryColumns
          .slice(0, -1)
          .map((col) => col.headerName)
          .join('_')
        : (category.field as string);
    const categories = groupedData.map((row) => row[field] as string);
    const _series = series.length === 0 ? configurableSeries.slice(0, 1) : series;

    const _options: EChartsCoreOption = deepmerge(
      {
        grid: { right: 8 },
        toolbox: {
          show: true,
          feature: {
            dataZoom: {
              yAxisIndex: 'none',
            },
            magicType: {
              type: ['stack'],
            },
            restore: {},
          },
        },
        legend: {
          type: 'scroll',
          icon: 'circle',
          bottom: 0,
        },
        tooltip: {
          trigger: 'axis',
          valueFormatter: series[0]?.formatter,
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
        series: _series.map((column) => ({
          name: column?.headerName,
          data: groupedData.map((row) => row[column?.field as string]),
          type: chartType,
          smooth: true,
        })),
      },
      props.config.chart?.config ?? {}
    );

    setOptions(_options);
  }, [props, category, series, chartType]);

  const changeCategory = (column: Column) => {
    setCategory(column);
  };

  const changeSeries = (column: Column) => {
    const match = series.find((s) => s.id === column.id);
    if (match) {
      setSeries(series.filter((s) => s.id !== column.id));
    } else {
      setSeries([...series, column]);
    }
  };

  const changeChartType = (chartType: ChartType) => {
    setChartType(chartType);
  };

  if (!options) {
    return null;
  }

  return (
    <div className="bg-chart__container">
      <ReactEChartsCore
        echarts={echarts}
        option={options}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: props.config.style?.maxHeight ?? '100%', width: '100%' }}
      />
      <SideBar
        config={props.config}
        categories={categoryColumns}
        series={configurableSeries}
        activeCategory={category?.id}
        activeSeries={series}
        activeChartType={chartType}
        setActiveCategory={changeCategory}
        setActiveSerie={changeSeries}
        setActiveChartType={changeChartType}
      />
    </div>
  );
}
