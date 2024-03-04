import { MouseEventHandler, useEffect, useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import { Column, IFilter } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';
import { CheckIcon, DividerHorizontalIcon } from '@radix-ui/react-icons';

type Props = {
  column: Column;
};

export default function MenuFilters(props: Props) {
  const { column } = props;
  const [searchValue, setSearchValue] = useState('');
  const [checked, setChecked] = useState<'indeterminate' | boolean>(false);

  const [filters, addFilter, selectAll] = useBeastStore((state) => [
    state.filters,
    state.addFilter,
    state.selectAllFilters,
  ]);

  useEffect(() => {
    if (filters[column.id]?.length === column.filterOptions?.length) {
      setChecked(true);
    } else if (!filters[column.id]?.length) {
      setChecked(false);
    } else {
      setChecked('indeterminate');
    }
  }, [filters, column.filterOptions, column.id, setChecked]);
  
  const handleFilterChange =
    (value: IFilter): MouseEventHandler<HTMLDivElement> =>
      () => {
        addFilter(column.id, value);
      };

  const handleSelectAll: MouseEventHandler<HTMLDivElement> = () => {
    selectAll(column.id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    setSearchValue(searchValue);
  };
  return (
    <>
      <input
        type="text"
        autoFocus
        placeholder="Search..."
        className="bg-menu__filter__search bg-menu__filter__item--big"
        onChange={handleSearch}
      />
      <div className="bg-menu__separator" />
      <SimpleBar style={{ maxHeight: 300 }} className="bg-menu__filter__container">
        {column.filterOptions?.map((item, idx) => (
          <div
            key={idx}
            className={cn('bg-menu__filter__item row middle', {
              hidden: searchValue && !(item as string).toLowerCase().includes(searchValue.toLowerCase()),
            })}
            onClick={handleFilterChange(item)}
          >
            <Checkbox.Root
              className="bg-checkbox__root"
              checked={!!filters[column.id]?.includes(item)}
              id={column.id}
            >
              <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label>{item}</label>
          </div>
        ))}
      </SimpleBar>
      <div className="bg-menu__separator" />
      <div className="bg-menu__filter__item bg-menu__filter__item--big row middle" onClick={handleSelectAll}>
        <Checkbox.Root
          className="bg-checkbox__root"
          checked={checked}
          onCheckedChange={setChecked}
          id={column.id}
        >
          <Checkbox.Indicator className="bg-checbox__indicator row middle center">
            {checked === 'indeterminate' && <DividerHorizontalIcon />}
            {checked === true && <CheckIcon />}
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label>Select all</label>
      </div>
    </>
  );
}
