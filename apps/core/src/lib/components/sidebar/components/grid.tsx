import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';

import { BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT } from '../../../common';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import cn from 'classnames';
import Accordion from '../../accordion/accordion';

type Props<T> = {
  columns: ColumnStore;
  config: BeastGridConfig<T>;
};

export default function GridConfig<T>({ columns, config }: Props<T>) {
  const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    setSearchValue(searchValue);
  };

  const options = Object.values(columns).filter((column) => column.level === 0);

  return (
    <div className={cn('bg-sidebar column', { border: config.style?.border })}>
      <div
        className="bg-sidebar__title row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <FormattedMessage id="toolbar.grid" />
        <Cross2Icon onClick={() => setSidebar(null)} />
      </div>
      <div
        className="bg-sidebar__input row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <input
          type="text"
          autoFocus
          placeholder="Search..."
          className="bg-sidebar__search"
          value={searchValue}
          onChange={handleSearch}
        />
        {searchValue && <Cross2Icon onClick={() => setSearchValue('')} />}
      </div>
      <SimpleBar className="bg-sidebar__container column">
        <Options options={options} columns={columns} searchValue={searchValue} />
      </SimpleBar>
    </div>
  );
}

const ItemLabel = ({ item, onClick }: { item: Column; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
  return (
    <>
      <Checkbox.Root className="bg-checkbox__root" checked={!item.hidden} id={item.id} onClick={onClick}>
        <Checkbox.Indicator className="bg-checbox__indicator row center middle">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label>{item.headerName}</label>
    </>
  );
};

const Options = ({
  options,
  parentMatch,
  columns,
  searchValue,
}: {
  options: Column[];
  parentMatch?: boolean;
  paddingLeft?: string;
  columns: ColumnStore;
  searchValue: string;
}) => {
  const [hideColumn] = useBeastStore((state) => [state.hideColumn]);

  const handleGridChange = (column: Column) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    hideColumn(column.id);
  };

  return options?.map((item, idx) => {
    const children = Object.values(columns).filter((c) => item.childrenId?.includes(c.id));
    const matchSearch = !searchValue || item.headerName.toLowerCase().includes(searchValue.toLowerCase());
    const hasChildren = item.childrenId?.length || 0;
    const hasMatchedChildren = children.some((c) => c.headerName.toLowerCase().includes(searchValue.toLowerCase()));

    if (!matchSearch && !hasChildren && !parentMatch) {
      return null;
    }

    if (hasChildren && !hasMatchedChildren && !matchSearch) {
      return null;
    }

    return (
      <Accordion
        key={`sidebar_grid_${item.id}_${idx}`}
        id={`sidebar_grid_${item.id}`}
        hideArrow={!hasChildren}
        label={<ItemLabel item={item} onClick={handleGridChange(item)} />}
        elements={children.length}
      >
        <Options options={children} parentMatch={matchSearch} columns={columns} searchValue={searchValue} />
      </Accordion>
    );
  });
};
