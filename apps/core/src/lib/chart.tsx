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
import { BeastGridConfig, ChartType, Column, ColumnStore, Data, SideBarConfig } from './common';
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
    const [category, setCategory] = useState<Column>();
    const [values, setValues] = useState<Column[]>();
    const [groups, setGroups] = useState<Column[]>();
    const [chartType, setChartType] = useState<ChartType>();

    if (!props.visible) {
        return null;
    }

    const updateCategory = (category: Column) => {
        setCategory(category);
    };

    const updateValues = (values: Column[]) => {
        setValues(values);
    };

    const updateGroups = (groups: Column[]) => {
        setGroups(groups);
    };

    const updateChartType = (chartType: ChartType) => {
        setChartType(chartType);
    };

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
                        columnStore={columns}
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
                columnStore={columns}
                category={category}
                values={values}
                groups={groups}
                chartType={chartType}
                updateCategory={updateCategory}
                updateValues={updateValues}
                updateGroups={updateGroups}
                updateChartType={updateChartType}
            />
        </div>
    );
}

type WrapperProps<T> = {
    config: BeastGridConfig<T>;
    columns: Column[];
    columnStore: ColumnStore;
    activeColumns?: Column[];
    data: Data;
    category?: Column;
    values?: Column[];
    groups?: Column[];
    chartType?: ChartType;
    updateCategory?: (category: Column) => void;
    updateValues?: (values: Column[]) => void;
    updateGroups?: (groups: Column[]) => void;
    updateChartType?: (chartType: ChartType) => void;
};

function ChartWrapper<T>(props: WrapperProps<T>) {
    const { columns, columnStore, data } = props;

    const configurableCategories = getCategories(columns, data);
    const configurableValues = getSeries(columns, data);
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
    const activeChartType = props.chartType || props.config.chart?.defaultValues?.chartType || (includeDate ? ChartType.LINE : ChartType.BAR) as ChartType

    const [category, setCategory] = useState<Column>(props.category || activeCategories[0]);
    const [values, setValues] = useState<Column[]>(props.values || activeColumns);
    const [groups, setGroups] = useState<Column[]>(
        props.groups || props.config.chart?.groupData === false ? [] : activeCategories.slice(1)
    );
    const [chartType, setChartType] = useState<ChartType>(activeChartType);

    const [options, setOptions] = useState<EChartsCoreOption>();

    useEffect(() => {
        const aggColumns = values.filter((col) => col.aggregation);
        const groupedData = category ? groupBy(data, category, aggColumns, columnStore) : data;
        const categories = category
            ? groupedData.map((row) => row[category.field as string])
            : new Array(data.length).fill(0).map((_, idx) => idx);
        const validGroups = groups.filter((group) => category?.id !== group.id);
        const seriesRecord: Record<string, { data: number[]; column: Column }> = {};

        groupedData.forEach((row, idx) => {
            const childGroups = validGroups.length
                ? groupByMultiple(row.children || [], validGroups, aggColumns, columnStore)
                : [row];
            const field = validGroups.map((g) => g.headerName).join('_');

            childGroups.forEach((group) => {
                const groupName = group[field];
                values.forEach((value) => {
                    const name = groupName ? `${value.headerName} - ${groupName}` : value.headerName;

                    if (!seriesRecord[name]) {
                        seriesRecord[name] = {
                            data: new Array(categories.length).fill(null),
                            column: value,
                        };
                    }

                    seriesRecord[name].data[idx] = group[value.field as string] as number;
                });
            });
        });

        const isPie = chartType === ChartType.PIE;
        const isLine = chartType === ChartType.LINE;
        const isHBar = chartType === ChartType.BAR_HORIZONTAL;

        const series = Object.entries(seriesRecord).map(([name, data], idx) => {
            return {
                name,
                type: chartType === ChartType.BAR_HORIZONTAL ? ChartType.BAR : chartType,
                radius: isPie && [`${70 - idx * 20}%`, `${70 - idx * 20 + 10}%`],
                tooltip: {
                    valueFormatter: data.column.formatter,
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
                smooth: true,
                data: data.data.map((d, idx) => ({
                    value: d,
                    name: categories[idx],
                    itemStyle: isLine && {
                        opacity: !data.data[idx + 1] ? 1 : 0,
                    },
                })),
            };
        });

        const _lineBarOptions = !isHBar ? {
            xAxis: {
                type: 'category',
                ...(!isLine && {
                    axisPointer: {
                        type: 'shadow',
                    },
                }),
                data: categories,
            },
            yAxis: {
                type: 'value',
                data: undefined,
                axisLabel: {
                    formatter: (value: number) => (value >= 1000 ? numeral(value).format('0,0 a') : value),
                },
            },
        } : {
            yAxis: {
                type: 'category',
                data: categories,
            },
            xAxis: {
                type: 'value',
                axisLabel: {
                    formatter: (value: number) => (value >= 1000 ? numeral(value).format('0,0 a') : value),
                },
            },
        };


        const _options: EChartsCoreOption = deepmerge(
            {
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
                    className: 'bg-chart-tooltip',
                },
                ...(isPie ? {} : _lineBarOptions),
                series,
            },
            props.config.chart?.config ?? {}
        );

        setOptions(_options);
    }, [props, category, values, groups, chartType]);

    if (!data.length) {
        return null;
    }

    const changeCategory = (column: Column) => {
        setCategory(column);
        setGroups(groups.filter((g) => g.id !== column.id));
        props.updateCategory?.(column);
    };

    const changeValues = (column: Column) => {
        const match = values.find((s) => s.id === column.id);
        let newValues = [];
        if (match) {
            newValues = values.filter((s) => s.id !== column.id);
        } else {
            newValues = [...values, column];
        }
        setValues(newValues);
        props.updateValues?.(newValues);
    };

    const changeChartType = (chartType: ChartType) => {
        setChartType(chartType);
        props.updateChartType?.(chartType);
    };

    const changeGroups = (column: Column) => {
        if (column.id === category?.id) {
            return;
        }
        const match = groups.find((s) => s.id === column.id);
        let newGroups = [];
        if (match) {
            newGroups = groups.filter((s) => s.id !== column.id);
        } else {
            newGroups = [...groups, column];
        }
        setGroups(newGroups);
        props.updateGroups?.(newGroups);
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
                values={configurableValues}
                groups={configurableCategories}
                activeCategory={category}
                activeValues={values}
                activeGroups={groups}
                activeChartType={chartType}
                setActiveCategory={changeCategory}
                setActiveValue={changeValues}
                setActiveGroup={changeGroups}
                setActiveChartType={changeChartType}
            />
        </Fragment>
    );
}
