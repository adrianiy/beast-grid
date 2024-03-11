import { BeastGridConfig, Column, HEADER_HEIGHT } from '../../../common';
import { FormattedMessage } from 'react-intl';

import cn from 'classnames';
import { useBeastStore } from '../../../stores/beast-store';
import { Cross2Icon } from '@radix-ui/react-icons';
import Accordion from '../../accordion/accordion';
import TextFilters from '../../filters/text';
import SimpleBar from 'simplebar-react';
import { useTraceUpdate } from '../../../utils/functions';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Filters<T>({ config }: Props<T>) {
  const [columns, setSidebar] = useBeastStore((state) => [state.sortedColumns, state.setSideBarConfig]);
  useTraceUpdate({ columns, config });

  return (
    <div className={cn('bg-sidebar column', { border: config.style?.border })}>
      <div
        className="bg-sidebar__title row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <FormattedMessage id="toolbar.filter" />
        <Cross2Icon onClick={() => setSidebar(null)} />
      </div>
      <SimpleBar className="bg-sidebar__content">
        <Options columns={columns} />
      </SimpleBar>
    </div>
  );
}

const Option = ({ option }: { option: Column }) => {
  return (
    <Accordion
      key={`sidebar_filter_${option.id}`}
      id={`sidebar_filter_${option.id}`}
      label={option.headerName}
      elements={option.filterOptions?.length || 0}
      height={400}
    >
      <TextFilters column={option} />
    </Accordion>
  );
};

const Options = ({ columns }: { columns: Column[] }) => {
  return columns.map((column, id) => <Option key={`filter-option-${column.id}-${id}`} option={column} />);
};
