import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  DatasetComponent,
} from 'echarts/components';
import { useBeastStore } from './stores/beast-store';
import { filterRow, getCategories, getDates, getSeries, groupBy, groupByMultiple } from './utils/functions';
import { BeastGridConfig, ChartType, Column, Data, SideBarConfig } from './common';
import deepmerge from 'deepmerge';
import { EChartsCoreOption } from 'echarts';
import SideBar from './components/sidebar/sidebar';
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import cn from 'classnames';

import { Cross2Icon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { FormattedMessage } from 'react-intl';

import './chart.scss';
import numeral from 'numeral';
import { getBaseSeriesConfig, getDateSeriesConfig } from './utils/chart';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  DatasetComponent,
]);

type Props<T> = {
  config: BeastGridConfig<T>;
  modal?: boolean;
  visible?: boolean;
  data?: Data;
  columns?: Column[];
  activeColumns?: Column[];
  onClose?: () => void;
};

export default function Chart<T>(props: Props<T>) {
  const [columns, sortedColumns, data, filters, theme, setSidebar] = useBeastStore((state) => [
    state.columns,
    state.sortedColumns,
    state.data,
    state.filters,
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
            <div className="bg-chart__title__actions row middle">
              <div
                className="bg-chart__modal__button row middle"
                onClick={() => setSidebar(SideBarConfig.CHART)}
              >
                <MixerHorizontalIcon />
                <FormattedMessage id="toolbar.chartConfig" defaultMessage="Chart Config" />
              </div>
              <Cross2Icon className="close" onClick={props.onClose} />
            </div>
          </div>
          <ChartWrapper
            config={props.config}
            columns={props.columns ?? sortedColumns}
            activeColumns={props.activeColumns}
            data={(props.data ?? data).map(filterRow(columns, filters)).filter(Boolean) as Data}
          />
        </div>
      </div>,
      document.body
    )
  ) : (
    <div className="bg-chart__container">
      <ChartWrapper
        config={props.config}
        columns={props.columns ?? sortedColumns}
        activeColumns={props.activeColumns}
        data={(props.data ?? data).map(filterRow(columns, filters)).filter(Boolean) as Data}
      />
    </div>
  );
}

type WrapperProps<T> = {
  config: BeastGridConfig<T>;
  columns: Column[];
  activeColumns?: Column[];
  data: Data;
};

function ChartWrapper<T>(props: WrapperProps<T>) {
  const { columns, data } = props;

  const configurableCategories = getCategories(columns, data);
  const configurableSeries = getSeries(columns, data);
  const dateColumns = getDates(configurableCategories, data);

  const dataColumns = columns.filter((col) =>
    props.config.chart?.defaultValues?.dataColumns?.includes(col.field as string)
  );
  const categoryColumns = columns.filter((col) =>
    props.config.chart?.defaultValues?.categoryColumns?.includes(col.field as string)
  );

  const activeColumns = getSeries(props.activeColumns || (dataColumns.length ? dataColumns : columns), data);
  const activeCategories =
    props.activeColumns?.filter((ac) => configurableCategories.find((cc) => cc.id === ac.id)) ||
    (categoryColumns.length ? categoryColumns : configurableCategories);
  const includeDate = activeCategories.find((c) => dateColumns.find((dc) => dc.id === c.id));

  const [categories, setCategories] = useState<Column[]>(activeCategories);
  const [series, setSeries] = useState<Column[]>(activeColumns);
  const [chartType, setChartType] = useState<ChartType>(
    (props.config.chart?.defaultValues?.chartType ?? includeDate ? ChartType.LINE : ChartType.BAR) as ChartType
  );

  const [options, setOptions] = useState<EChartsCoreOption>();

  useEffect(() => {
    const includeDate = categories.find((c) => dateColumns.find((dc) => dc.id === c.id));
    const aggColumns = columns.filter((col) => col.aggregation);
    const categoriesWoDates = categories.filter((c) => !dateColumns.find((dc) => dc.id === c.id));
    const dateColumn = categories.find((c) => dateColumns.find((dc) => dc.id === c.id));
    const field = categoriesWoDates.map((c) => c.headerName).join('_');

    const source =
      includeDate && dateColumn
        ? groupBy(data, dateColumn, aggColumns)
        : groupByMultiple(data, categories, aggColumns);

    const dateSeries: Record<string, Column> = {};

    if (includeDate) {
      source.forEach((row) => {
        const children = groupByMultiple(row.children || [], categoriesWoDates, aggColumns);

        children.forEach((child) => {
          series.forEach((column) => {
            const key = child[field] ? `${column.field} - ${child[field]}` : (column.field as string);
            dateSeries[key] = { ...column, field: key };
            row[key] = child[column.field as string];
          });
        });
      });
    }

    const isPie = chartType === ChartType.PIE;
    const isLine = chartType === ChartType.LINE;

    const _lineBarOptions = {
      xAxis: {
        type: 'category',
        ...!isLine && {
          axisPointer: {
            type: 'shadow',
          },
        },
        data: includeDate && source.map((row) => row[dateColumn?.field as string])
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => (value >= 1000 ? numeral(value).format('0,0 a') : value),
        },
      },
    };

    const _options: EChartsCoreOption = deepmerge(
      {
        dataset: !includeDate && {
          dimensions: [field, ...series.map((s) => s.field as string)],
          source,
        },
        grid: { left: 50, right: 8 },
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
          trigger: isPie ? 'item' : 'axis',
          padding: 16,
          appendToBody: true,
          extraCssText: 'border: 0.001em solid black; border-radius: 0; box-shadow: none',
        },
        ...(isPie ? {} : _lineBarOptions),
        series: includeDate ? getDateSeriesConfig(Object.values(dateSeries), source, chartType) : getBaseSeriesConfig(series, isPie, chartType)
      },
      props.config.chart?.config ?? {}
    );

    setOptions(_options);
  }, [props, categories, series, chartType]);

  const changeCategory = (column: Column) => {
    const match = categories.find((c) => c.id === column.id);
    if (match) {
      setCategories(categories.filter((c) => c.id !== column.id));
    } else {
      setCategories([...categories, column]);
    }
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
    <Fragment>
      <ReactEChartsCore
        echarts={echarts}
        option={options}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: props.config.style?.maxHeight ?? '100%', width: '100%' }}
      />
      <SideBar
        config={props.config}
        categories={configurableCategories}
        series={configurableSeries}
        activeCategories={categories}
        activeSeries={series}
        activeChartType={chartType}
        setActiveCategory={changeCategory}
        setActiveSerie={changeSeries}
        setActiveChartType={changeChartType}
      />
    </Fragment>
  );
}
