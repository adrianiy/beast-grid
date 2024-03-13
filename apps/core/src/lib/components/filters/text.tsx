import { MouseEventHandler, useEffect, useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import { Column, IFilter } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import { CheckIcon, Cross2Icon, DividerHorizontalIcon } from '@radix-ui/react-icons';

import cn from 'classnames';

import './menu-filters.scss';
import Input from '../input/input';

type Props = {
  column: Column;
};

export default function TextFilters(props: Props) {
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }
  
  return (
    <div className="bg-filter bg-filter__text" onClick={handleClick}>
      <Input placeholder="Search..." className="bg-filter__search" onChange={handleSearch} />
      
      <div className="bg-filter__separator" />
      
      <SimpleBar style={{ maxHeight: 300 }} className="bg-filter__container">
        {column.filterOptions?.map((item, idx) => (
          <div
            key={idx}
            className={cn('bg-filter__item row middle', {
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
            <label>{item as string}</label>
          </div>
        ))}
      </SimpleBar>
      <div className="bg-filter__separator" />
      <div className="bg-filter__item bg-menu__filter__item--big row middle" onClick={handleSelectAll}>
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
    </div>
  );
}
