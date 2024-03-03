import { MouseEventHandler, useEffect, useRef, useState } from 'react';

import { ArrowDownward, ArrowUpward, Check, ChevronRight, Close } from '@mui/icons-material';
import { Column, Coords, IFilter, SortType, MenuProps, PinType } from '../../common';

import { useBeastStore } from '../../stores/beast-store';
import { useMenuStore } from '../../stores/menu-store';

import cn from 'classnames';

import './menu-layer.scss';

type Props = {
  column: Column;
  multiSort: boolean;
  coords?: Coords;
};

export default function MenuLayer() {
  const [columnId] = useMenuStore((state) => [state.column]);
  const [columns, multiSort] = useBeastStore((state) => [state.columns, state.allowMultipleColumnSort]);

  if (!columnId) {
    return null;
  }

  return <HeaderMenu column={columns[columnId]} multiSort={multiSort} />;
}

function HeaderMenu({ column, multiSort }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [clipRef, coords, setCoords, setMenuColumn] = useMenuStore((state) => [
    state.clipRef,
    state.coords,
    state.setCoords,
    state.setColumn,
  ]);

  const [container, columns, filters, hideColumn, addFilter, selectAll, setSort, resetColumn, pinColumn] = useBeastStore(
    (state) => [
      state.scrollElement,
      state.columns,
      state.filters,
      state.hideColumn,
      state.addFilter,
      state.selectAllFilters,
      state.setSort,
      state.resetColumnConfig,
      state.pinColumn
    ]
  );

  useEffect(() => {
    const leftPinned = Object.values(columns)
      .filter((col) => col.pinned === 'left')
      .reduce((acc, curr) => acc + curr.width, 0);
    const moveMenu = () => {
      if (!clipRef || !clipRef()) {
        return;
      }

      const { left: cLeft, top: cTop, right: cRight } = container.getBoundingClientRect();
      const { left, bottom } = clipRef().getBoundingClientRect();

      const x = left - cLeft;
      const y = bottom - cTop + 12;
      const min = column.pinned !== PinType.LEFT ? leftPinned : 0;
      const max = cRight - cLeft;

      if (x < min || x > max) {
        setMenuColumn(undefined);
      }

      setCoords({ x, y });
    };

    moveMenu();

    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuColumn(undefined);
      }
    };

    setTimeout(() => {
      menuRef.current?.style.setProperty('overflow', 'visible');
    }, 300);

    document.addEventListener('click', closeMenu);
    document.addEventListener('scroll', moveMenu);
    container.addEventListener('scroll', moveMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('scroll', moveMenu);
      container.removeEventListener('scroll', moveMenu);
    };
  }, []);

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
  };

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
  
  const handlePinColumn = (pinType: PinType) => () => {
    pinColumn(column.id, column.pinned === pinType ? undefined : pinType);
    setMenuColumn(undefined)
  }

  const renderSort = () => {
    if (!column.sortable) {
      return null;
    }
    if (!column.sort) {
      return (
        <div className="bg-menu__content column config">
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.ASC)}>
            <ArrowUpward /> Ascending
          </div>
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.DESC)}>
            <ArrowDownward />
            Descending
          </div>
          <div className="bg-menu__separator" />
        </div>
      );
    } else {
      return (
        <div className="bg-menu__content column config">
          <div
            className={cn('bg-menu__item row middle')}
            onClick={handleSetSort(column.sort?.order === SortType.ASC ? SortType.DESC : SortType.ASC)}
          >
            {column.sort?.order === SortType.DESC ? <ArrowUpward /> : <ArrowDownward />}
            {column.sort?.order === SortType.DESC ? 'Ascending' : 'Descending'}
          </div>
          <div className="bg-menu__item row middle" onClick={handleResetColumn}>
            <Close /> Reset column
          </div>
          <div className="bg-menu__separator" />
        </div>
      );
    }
  };

  const renderPin = () => {
    if (!column.menu?.pin) {
      return null;
    }
    return (
      <div className="bg-menu__content column config">
        <div className="bg-menu__item bg-menu__item--with-submenu row middle between">
          Pin
          <ChevronRight />
        </div>
        <div className="bg-menu__separator" />
        <div className="bg-menu__item__submenu column">
          <div className="bg-menu__item row middle between" onClick={handlePinColumn(PinType.LEFT)}>
            { column.pinned === PinType.LEFT ?  "Unpin column" : "Pin left"}
            { column.pinned === PinType.LEFT ?  <Check /> : null }
          </div>
          <div className="bg-menu__separator--transparent" />
          <div className="bg-menu__item row middle" onClick={handlePinColumn(PinType.RIGHT)}>
            { column.pinned === PinType.RIGHT ?  "Unpin column" : "Pin right"}
            { column.pinned === PinType.RIGHT ?  <Check /> : null }
          </div>
        </div>
      </div>
    );
  }

  // grid columns visibility configuration
  const renderGridConfig = () => {
    if (!column.menu || !(column.menu as MenuProps)?.grid) {
      return null;
    }
    return (
      <div className="bg-menu__content column grid-config">
        <input type="text" placeholder="Search" className="bg-menu__grid__search" onChange={handleSearch} />
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
      </div>
    );
  };

  const renderFilter = () => {
    if (!column.menu || !(column.menu as MenuProps)?.filter) {
      return null;
    }
    // render checkboxes for filterData
    return (
      <div className="bg-menu__content column filter">
        <div className="bg-menu__item bg-menu__item--with-submenu row middle between">
          Filter
          <ChevronRight />
        </div>
        <div className="bg-menu__separator" />
        <div className="bg-menu__item__submenu column">
          <input
            type="text"
            autoFocus
            placeholder="Search..."
            className="bg-menu__filter__search bg-menu__filter__item--big"
            onChange={handleSearch}
          />
          <div className="bg-menu__separator" />
          <div className="bg-menu__filter__container column">
            {column.filterOptions?.map((item, idx) => (
              <div
                key={idx}
                className={cn('bg-menu__filter__item row middle', {
                  hidden:
                    searchValue &&
                    !(item as string).toLowerCase().includes(searchValue.toLowerCase()),
                })}
                onClick={handleFilterChange(item)}
              >
                <input type="checkbox" readOnly checked={!!filters[column.id]?.includes(item)} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-menu__separator" />
          <div className="bg-menu__filter__item--big row middle" onClick={handleSelectAll}>
            <input
              type="checkbox"
              readOnly
              checked={filters[column.id]?.length === column.filterOptions?.length}
            />
            <span>Select all</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className="bg-menu__container animate__animated animate__fadeIn"
      style={{ top: coords?.y, left: coords?.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-menu__wrapper animate__animated animate__faster animate__fadeInDown">
        {renderSort()}
        {renderPin()}
        {renderFilter()}
      </div>
    </div>
  );
}
