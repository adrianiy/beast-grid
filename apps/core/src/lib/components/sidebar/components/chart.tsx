import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import { BeastGridConfig, ChartType, Column, HEADER_HEIGHT } from '../../../common';

import * as Checkbox from '@radix-ui/react-checkbox';

import { useBeastStore } from '../../../stores/beast-store';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';

import cn from 'classnames';
import Accordion from '../../accordion/accordion';

type Props<T> = {
  config: BeastGridConfig<T>;
} & Partial<{
  categories: Column[];
  series: Column[];
  activeCategory: Column;
  activeSeries: Column[];
  activeChartType: ChartType;
  setActiveCategory: (column: Column) => void;  
  setActiveSerie: (column: Column) => void;
  setActiveChartType: (chartType: ChartType) => void;
}>;

const chartTypes = [
  { id: ChartType.LINE, label: 'Line' },
  { id: ChartType.BAR, label: 'Bar' },
  { id: ChartType.PIE, label: 'Pie' },
];

export default function ChartConfig<T>({ config, categories, series, activeCategory, activeChartType, activeSeries, setActiveCategory, setActiveSerie, setActiveChartType }: Props<T>) {
  const ref = useRef<SimpleBarCore>(null);
  const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

  const handleCategoryChange = (category: Column) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCategory?.(category);
  }

  const handleSerieChange = (serie: Column) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSerie?.(serie);
  }

  const handleChartTypeChange = (chartType: ChartType) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveChartType?.(chartType);
  }

  return (
    <div className={cn('bg-sidebar column', { border: config.style?.border })}>
      <div
        className="bg-sidebar__title row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <FormattedMessage id="toolbar.chartConfig" />
        <Cross2Icon onClick={() => setSidebar(null)} />
      </div>
      <SimpleBar className="bg-sidebar__content" ref={ref}>
        <Accordion
          key={`sidebar_chart_type`}
          id={`sidebar_chart_type`}
          label={<FormattedMessage id="chart.type" />}
          elements={3}
        >
          {chartTypes?.map((chartType) => (
            <div key={`category-${chartType.id}`} className="row middle bg-sidebar__chart__item" onClick={handleChartTypeChange(chartType.id as ChartType)}>
              <input readOnly type="radio" id={chartType.id} name="type" checked={activeChartType === chartType.id} />
              <label><FormattedMessage id={`chart.${chartType.id}`}/></label>
            </div>
          ))}
        </Accordion>
        <Accordion
          key={`sidebar_chart_categories`}
          id={`sidebar_chart_categories`}
          label={<FormattedMessage id="chart.categories" />}
          elements={categories?.length || 0}
        >
          {categories?.map((category) => (
            <div key={`category-${category.id}`} className="row middle bg-sidebar__chart__item" onClick={handleCategoryChange(category)}>
              <Checkbox.Root
                className="bg-checkbox__root row middle"
                checked={activeCategory?.id === category.id}
                id={category.id}
              >
                <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label>{category.headerName}</label>
            </div>
          ))}
        </Accordion>
        <Accordion
          key={`sidebar_chart_series`}
          id={`sidebar_chart_series`}
          label={<FormattedMessage id="chart.series" />}
          elements={series?.length || 0}
        >
          {series?.map((serie) => (
            <div key={serie.id} className="row middle bg-sidebar__chart__item" onClick={handleSerieChange(serie)}>
              <Checkbox.Root
                className="bg-checkbox__root row middle"
                checked={!!activeSeries?.find(s => s.id === serie.id)}
                id={serie.id}
              >
                <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label>{serie.headerName}</label>
            </div>
          ))}
        </Accordion>
      </SimpleBar>
    </div>
  );
}
