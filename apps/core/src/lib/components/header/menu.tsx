import { MouseEventHandler, useState } from 'react';

import { ArrowDownward, ArrowUpward, Close } from '@mui/icons-material';
import { useBeastStore } from '../../stores/beast-store';
import { Column, IFilter, SortType } from '../../common';

import cn from 'classnames';

enum Tab {
  TAB1 = 'Config.',
  TAB2 = 'Filter',
  TAB3 = 'Grid',
}

type Props = {
  column: Column;
  multiSort: boolean;
};

export default function HeaderMenu({ column, multiSort }: Props) {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState(Tab.TAB1);

  const [filters, addFilter, selectAll, setSort, resetColumn] = useBeastStore((state) => [
    state.filters,
    state.addFilter,
    state.selectAllFilters,
    state.setSort,
    state.resetColumnConfig,
  ]);

  const handleTabChange =
    (tab: Tab): MouseEventHandler<HTMLDivElement> =>
      () => {
        setActiveTab(tab);
      };

  const handleSetSort =
    (sort: SortType): MouseEventHandler<HTMLDivElement> =>
      () => {
        setSort(column.id, sort, multiSort);
      };

  const handleResetColumn: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    resetColumn(column.id);
  };

  const handleFilterChange =
    (value: IFilter): MouseEventHandler<HTMLDivElement> =>
      () => {
        addFilter(column.id, value);
      };

  const handleFilterSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filterValue = e.target.value;

    setSearchValue(filterValue);
  };

  const handleSelectAll: MouseEventHandler<HTMLDivElement> = () => {
    selectAll(column.id);
  };

  const renderConfig = () => {
    if (activeTab !== Tab.TAB1) {
      return null;
    }

    return (
      <div className="bg-menu__content column config">
        <div
          className={cn('bg-config__item row middle', column.sort?.order === SortType.DESC && 'inactive')}
          onClick={handleSetSort(SortType.ASC)}
        >
          <ArrowUpward /> Ascending
        </div>
        <div
          className={cn('bg-config__item row middle', column.sort?.order === SortType.ASC && 'inactive')}
          onClick={handleSetSort(SortType.DESC)}
        >
          <ArrowDownward />
          Descending
        </div>
        <div className="bg-menu__separator" />
        <div className="bg-config__item row middle" onClick={handleResetColumn}>
          <Close /> Reset column
        </div>
      </div>
    );
  };

  const renderFilter = () => {
    if (activeTab !== Tab.TAB2) {
      return null;
    }

    // render checkboxes for filterData
    return (
      <div className="bg-menu__content column filter">
        <input
          type="text"
          placeholder="Search"
          className="bg-menu__filter__search"
          onChange={handleFilterSearch}
        />
        <div className="bg-menu__filter__container column">
          {column.filterOptions?.map((item, idx) => (
            <div
              key={idx}
              className="bg-menu__filter__item row middle"
              style={{
                display:
                  searchValue &&
                    !(item as string).toLowerCase().includes(searchValue.toLowerCase())
                    ? 'none'
                    : 'flex',
              }}
              onClick={handleFilterChange(item)}
            >
              <input type="checkbox" readOnly checked={!!filters[column.id]?.includes(item)} />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-menu__separator" />
        <div className="bg-config__item row middle" onClick={handleSelectAll}>
          <input type="checkbox" readOnly checked={filters[column.id]?.length === column.filterOptions?.length} />
          <span>Select all</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-menu__container" onClick={(e) => e.stopPropagation()}>
      <div className="bg-nav-bar__container row middle">
        <div
          className={cn('bg-nav-bar__item', activeTab === Tab.TAB1 && 'active')}
          onClick={handleTabChange(Tab.TAB1)}
        >
          {Tab.TAB1}
        </div>
        <div
          className={cn('bg-nav-bar__item', activeTab === Tab.TAB2 && 'active')}
          onClick={handleTabChange(Tab.TAB2)}
        >
          {Tab.TAB2}
        </div>
        <div
          className={cn('bg-nav-bar__item', activeTab === Tab.TAB3 && 'active')}
          onClick={handleTabChange(Tab.TAB3)}
        >
          {Tab.TAB3}
        </div>
      </div>
      {renderConfig()}
      {renderFilter()}
    </div>
  );
}
