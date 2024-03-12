import { useEffect, useRef, useState } from 'react';
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
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      setScrollElement(ref.current.getScrollElement() as HTMLDivElement);
    }
  }, [ref]);

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
        <Options columns={Object.values(columns).filter(column => column.level === 0)} scrollContainer={scrollElement} />
      </SimpleBar>
    </div>
  );
}

export const Filter = ({ column, scrollContainer }: { column: Column; scrollContainer: HTMLDivElement | null }) => {
  const [filters] = useBeastStore((state) => [state.filters]);

  switch (column.filterType) {
    case FilterType.TEXT:
      return <TextFilters column={column} />;
    case FilterType.NUMBER:
      return <NumberFilter column={column} scrollContainer={scrollContainer} filters={filters} />;
    default:
      return null;
  }
};

const OptionLabel = ({ option }: { option: Column }) => {
  const [filters] = useBeastStore((state) => [state.filters]);

  return (
    <div className="bg-filter__label row middle">
      {option.headerName}
      {(filters[option.id] || option.childrenId?.some(id => filters[id])) && <div className="bg-dot--active" />}
    </div>
  );
};

const Option = ({ option, scrollContainer }: { option: Column; scrollContainer: HTMLDivElement | null }) => {
  const [columns] = useBeastStore((state) => [state.columns]);
  return (
    <Accordion
      key={`sidebar_filter_${option.id}`}
      id={`sidebar_filter_${option.id}`}
      label={<OptionLabel option={option} />}
      elements={option.childrenId ? option.childrenId.length : option.filterOptions?.length || 0}
      height={option.childrenId ? undefined : option.filterType === FilterType.TEXT ? 400 : 200}
    >
      {option.childrenId ? (
        <Options columns={option.childrenId.map(id => columns[id])} scrollContainer={scrollContainer} />
      ) : (
        <Filter column={option} scrollContainer={scrollContainer} />
      )}
    </Accordion>
  );
};

const Options = ({ columns, scrollContainer }: { columns: Column[]; scrollContainer: HTMLDivElement | null }) => {
  return columns
    .map((column, id) => (
      <Option key={`filter-option-${column.id}-${id}`} option={column} scrollContainer={scrollContainer} />
    ));
};
