import { MouseEventHandler, useEffect, useRef, useState } from 'react';

import { ArrowDownward, ArrowUpward, Close } from '@mui/icons-material';
import { useBeastStore } from '../../stores/beast-store';
import { Column, Coords, IFilter, SortType } from '../../common';

import cn from 'classnames';
import { useMenuStore } from '../../stores/menu-store';

import './menu-layer.scss';

enum Tab {
  TAB1 = 'Config.',
  TAB2 = 'Filter',
  TAB3 = 'Grid',
}

type Props = {
  column: Column;
  multiSort: boolean;
  coords?: Coords;
};

export default function MenuLayer() {
  const [columnId] = useMenuStore((state) => [state.column]);
  const [columns, multiSort] = useBeastStore((state) => [state.columns, state.allowMultipleColumnSort]);

  console.log(columnId);
  if (!columnId) {
    return null;
  }

  return <HeaderMenu column={columns[columnId]} multiSort={multiSort} />;
}

function HeaderMenu({ column, multiSort }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState(Tab.TAB1);
  const [clipRef, coords, setCoords, setMenuColumn] = useMenuStore((state) => [
    state.clipRef,
    state.coords,
    state.setCoords,
    state.setColumn,
  ]);

  const [container, columns, filters, hideColumn, addFilter, selectAll, setSort, resetColumn] = useBeastStore(
    (state) => [
      state.container,
      state.columns,
      state.filters,
      state.hideColumn,
      state.addFilter,
      state.selectAllFilters,
      state.setSort,
      state.resetColumnConfig,
    ]
  );

  useEffect(() => {
    const moveMenu = () => {
      if (!clipRef) {
        return;
      }

      const coontainerRect = container.getBoundingClientRect();
      const { left, bottom } = clipRef.getBoundingClientRect();

      if (left < coontainerRect.left || left > coontainerRect.right) {
        setMenuColumn(undefined);
      } else {
        setCoords({ x: left, y: coords?.y || bottom + 12 });
      }
    };

    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuColumn(undefined);
      }
    };

    document.addEventListener('click', closeMenu);
    container.addEventListener('scroll', moveMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
      container.removeEventListener('scroll', moveMenu);
    };
  }, []);

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

  const handleGridChange = (column: Column) => () => {
    hideColumn(column.id);
  }

  const handleFilterChange =
    (value: IFilter): MouseEventHandler<HTMLDivElement> =>
      () => {
        addFilter(column.id, value);
      };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    setSearchValue(searchValue);
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

  // grid columns visibility configuration
  const renderGridConfig = () => {
    if (activeTab !== Tab.TAB3) {
      return null;
    }

    return <div className="bg-menu__content column grid-config">
        <input
          type="text"
          placeholder="Search"
          className="bg-menu__grid__search"
          onChange={handleSearch}
        />
        <div className="bg-menu__filter__container column">
          {Object.values(columns)?.map((item, idx) => (
            <div
              key={idx}
              className="bg-menu__grid__item row middle"
              style={{
                display:
                  searchValue && !item.headerName.toLowerCase().includes(searchValue.toLowerCase())
                    ? 'none'
                    : 'flex',
              }}
              onClick={handleGridChange(item)}
            >
              <input type="checkbox" readOnly checked={!item.hidden} />
              <span>{item.headerName}</span>
            </div>
          ))}
        </div>
      
    </div>;
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
          onChange={handleSearch}
        />
        <div className="bg-menu__filter__container column">
          {column.filterOptions?.map((item, idx) => (
            <div
              key={idx}
              className="bg-menu__filter__item row middle"
              style={{
                display:
                  searchValue && !(item as string).toLowerCase().includes(searchValue.toLowerCase())
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
          <input
            type="checkbox"
            readOnly
            checked={filters[column.id]?.length === column.filterOptions?.length}
          />
          <span>Select all</span>
        </div>
      </div>
    );
  };

  const getTabs = () => {
    if (typeof column.menu === 'boolean') {
      return [Tab.TAB1, Tab.TAB2, Tab.TAB3];
    } else {
      return [column.menu?.column && Tab.TAB1, column.menu?.filter && Tab.TAB2, column.menu?.grid && Tab.TAB3].filter(Boolean)
    }
  }

  const tabs = getTabs();
  
  return (
    <div
      ref={menuRef}
      className="bg-menu__container"
      style={{ top: coords?.y, left: coords?.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-nav-bar__container row middle">
        {tabs.map((tab, idx) => (
          <div
            key={idx}
            className={cn('bg-nav-bar__item', activeTab === tab && 'active')}
            onClick={handleTabChange(tab as Tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      {renderConfig()}
      {renderFilter()}
      {renderGridConfig()}
    </div>
  );
}
