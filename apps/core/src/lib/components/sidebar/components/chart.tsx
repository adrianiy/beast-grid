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
import useOnClickOutside from '../../../hooks/clickOutside';

type Props<T> = {
  config: BeastGridConfig<T>;
} & Partial<{
  categories: Column[];
  values: Column[];
  groups: Column[];
  activeCategory: Column;
  activeValues: Column[];
  activeGroups: Column[];
  activeChartType: ChartType;
  setActiveCategory: (column: Column) => void;
  setActiveValue: (column: Column) => void;
  setActiveGroup: (column: Column) => void;
  setActiveChartType: (chartType: ChartType) => void;
}>;

const chartTypes = [
  { id: ChartType.LINE, label: 'Line' },
  { id: ChartType.BAR, label: 'Bar' },
  { id: ChartType.PIE, label: 'Pie' },
];

export default function ChartConfig<T>({
  config,
  categories,
  values,
  groups,
  activeCategory,
  activeChartType,
  activeGroups,
  activeValues,
  setActiveCategory,
  setActiveValue,
  setActiveGroup,
  setActiveChartType,
}: Props<T>) {
  const sideBarRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SimpleBarCore>(null);
  const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);
  
  useOnClickOutside(sideBarRef, () => setSidebar(null));

  const handleCategoryChange = (category: Column) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCategory?.(category);
  };

  const handleValueChange = (value: Column) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveValue?.(value);
  };

  const handleGroupChange = (group: Column) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveGroup?.(group);
  }

  const handleChartTypeChange = (chartType: ChartType) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveChartType?.(chartType);
  };

  return (
    <div ref={sideBarRef} className={cn('bg-sidebar column', { border: config.style?.border })}>
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
            <div
              key={`category-${chartType.id}`}
              className="row middle bg-sidebar__chart__item"
              onClick={handleChartTypeChange(chartType.id as ChartType)}
            >
              <input
                readOnly
                type="radio"
                id={chartType.id}
                name="type"
                checked={activeChartType === chartType.id}
              />
              <label>
                <FormattedMessage id={`chart.${chartType.id}`} />
              </label>
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
            <div
              key={`category-${category.id}`}
              className="row middle bg-sidebar__chart__item"
              onClick={handleCategoryChange(category)}
            >
              <input
                readOnly
                type="radio"
                id={category.id}
                name="category"
                checked={activeCategory?.id === category.id}
              />
              <label>{category.headerName}</label>
            </div>
          ))}
        </Accordion>
        <Accordion
          key={`sidebar_chart_groups`}
          id={`sidebar_chart_groups`}
          label={<FormattedMessage id="chart.groups" />}
          elements={groups?.length || 0}
        >
          {groups?.map((group) => (
            <div
              key={group.id}
              className={cn('row middle bg-sidebar__chart__item', { disabled: activeCategory?.id === group.id })}
              onClick={handleGroupChange(group)}
            >
              <Checkbox.Root
                className="bg-checkbox__root row middle"
                disabled={activeCategory?.id === group.id}
                checked={!!activeGroups?.find((s) => s.id === group.id)}
                id={group.id}
              >
                <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label>{group.headerName}</label>
            </div>
          ))}
        </Accordion>
        <Accordion
          key={`sidebar_chart_values`}
          id={`sidebar_chart_values`}
          label={<FormattedMessage id="chart.values" />}
          elements={values?.length || 0}
        >
          {values?.map((value) => (
            <div
              key={value.id}
              className="row middle bg-sidebar__chart__item"
              onClick={handleValueChange(value)}
            >
              <Checkbox.Root
                className="bg-checkbox__root row middle"
                checked={!!activeValues?.find((s) => s.id === value.id)}
                id={value.id}
              >
                <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label>{value.headerName}</label>
            </div>
          ))}
        </Accordion>
      </SimpleBar>
    </div>
  );
}
