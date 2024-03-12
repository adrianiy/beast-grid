import { useRef } from 'react';
import { BeastGridConfig, Column, FilterType, HEADER_HEIGHT } from '../../../common';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';
import { Cross2Icon } from '@radix-ui/react-icons';
import Accordion from '../../accordion/accordion';
import TextFilters from '../../filters/text';
import NumberFilter from '../../filters/number';

import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';

import cn from 'classnames';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Filters<T>({ config }: Props<T>) {
  const ref = useRef<SimpleBarCore>(null);
  const [columns, setSidebar] = useBeastStore((state) => [state.columns, state.setSideBarConfig]);

  return (
    <div className={cn('bg-sidebar column', { border: config.style?.border })}>
      <div
        className="bg-sidebar__title row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <FormattedMessage id="toolbar.filter" />
        <Cross2Icon onClick={() => setSidebar(null)} />
      </div>
      <SimpleBar className="bg-sidebar__content" ref={ref}>
        <Options columns={Object.values(columns)} scrollContainer={ref.current?.getScrollElement() as HTMLDivElement} />
      </SimpleBar>
    </div>
  );
}

const Filter = ({ option, scrollContainer }: { option: Column, scrollContainer: HTMLDivElement | null }) => {
  const [filters] = useBeastStore((state) => [state.filters]);
  
  switch (option.filterType) {
    case FilterType.TEXT:
      return <TextFilters column={option} />;
    case FilterType.NUMBER:
      return <NumberFilter column={option} scrollContainer={scrollContainer} filters={filters} />;
    default:
      return null;
  }
}

const Option = ({ option, scrollContainer }: { option: Column, scrollContainer: HTMLDivElement | null }) => {
  return (
    <Accordion
      key={`sidebar_filter_${option.id}`}
      id={`sidebar_filter_${option.id}`}
      label={option.headerName}
      elements={option.filterOptions?.length || 0}
      height={option.filterType === FilterType.TEXT ? 400 : 200}
    >
      <Filter option={option} scrollContainer={scrollContainer} />
    </Accordion>
  );
};

const Options = ({ columns, scrollContainer }: { columns: Column[], scrollContainer: HTMLDivElement | null }) => {
  return columns.filter(column => column.final).map((column, id) => <Option key={`filter-option-${column.id}-${id}`} option={column} scrollContainer={scrollContainer} />);
};
