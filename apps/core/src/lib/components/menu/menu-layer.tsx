import { MouseEventHandler, useEffect, useRef, useState } from 'react';

import { ArrowDownward, ArrowUpward, Check, ChevronRight, Close } from '@mui/icons-material';
import { Column, IFilter, SortType, MenuProps, PinType, MenuVerticalPosition, MenuHorizontalPosition } from '../../common';

import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';

import './menu-layer.scss';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';

type Props = {
  column: Column;
  multiSort: boolean;
  vertical: MenuVerticalPosition;
  horizontal: MenuHorizontalPosition;
  clipRef: () => SVGSVGElement;
  onClose: () => void;
};

export default function HeaderMenu({ column, multiSort, vertical, horizontal, clipRef, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [verticalPosition, setVerticalPosition] = useState<MenuVerticalPosition>(vertical);
  const [horizontalPosition, setHorizontalPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [horizontalSubmenuPosition, setHorizontalSubmenuPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [searchValue, setSearchValue] = useState('');
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const [container, columns, theme, filters, hideColumn, addFilter, selectAll, setSort, resetColumn, pinColumn] = useBeastStore(
    (state) => [
      state.scrollElement,
      state.columns,
      state.theme,
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
      .filter((col) => col.pinned === PinType.LEFT)
      .reduce((acc, curr) => acc + curr.width, 0);
    
    const moveMenu = () => {
      if (!clipRef) {
        return;
      }

      const { left: cLeft, right: cRight } = container.getBoundingClientRect();
      const { bottom: mB, width } = menuRef.current?.getBoundingClientRect() || { left: 0, top: 0, right: 0, bottom: 0, width: 0 };
      const { left, right, bottom } = clipRef().getBoundingClientRect();

      const x = window.scrollX + left;
      const y = window.scrollY + bottom + 8;
      
      setCoords({ x, y });
      
      if (mB > window.innerHeight) {
        setVerticalPosition(MenuVerticalPosition.TOP);
      }
      if (right > cRight) {
        onClose();
        return;
      }
      if (left + (width * 2) > cRight) {
        setHorizontalSubmenuPosition(MenuHorizontalPosition.RIGHT);
      } else {
        setHorizontalSubmenuPosition(MenuHorizontalPosition.LEFT);
      }
      if (left + width > cRight) {
        setHorizontalPosition(MenuHorizontalPosition.RIGHT);
        return;
      } else {
        setHorizontalPosition(MenuHorizontalPosition.LEFT);
      }

      if (column.pinned !== PinType.NONE) {
        return;
      }
      if (left < cLeft + leftPinned || (x + width) > cRight) {
        onClose();
      }

    };

    moveMenu();

    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    setTimeout(() => {
      menuRef.current?.style.setProperty('overflow', 'visible');
    }, 300);

    document.addEventListener('click', closeMenu);
    container.addEventListener('scroll', moveMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('scroll', moveMenu);
      container.removeEventListener('scroll', moveMenu);
    };
  }, [verticalPosition, horizontalPosition]);

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
    pinColumn(column.id, column.pinned === pinType ? PinType.NONE : pinType);
    onClose()
  }

  const renderSort = () => {
    if (!column.sortable) {
      return null;
    }
    if (!column.sort) {
      return (
        <div className="bg-menu__content column config">
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.ASC)}>
            <IconSortAscending size={16} /> Ascending
          </div>
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.DESC)}>
            <IconSortDescending size={16} />
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
            <Close /> Reset sort
          </div>
          <div className="bg-menu__separator" />
        </div>
      );
    }
  };

  const renderPin = () => {
    if (!column.menu?.pin || column.parent) {
      return null;
    }
    return (
      <div className="bg-menu__content column config">
        <div className="bg-menu__item bg-menu__item--with-submenu row middle between">
          Pin
          <ChevronRight />
        </div>
        <div className="bg-menu__separator" />
        <div className={cn("bg-menu__item__submenu column", horizontalSubmenuPosition)}>
          <div className="bg-menu__item row middle between" onClick={handlePinColumn(PinType.LEFT)}>
            Pin left
            { column.pinned === PinType.LEFT ?  <Check /> : null }
          </div>
          <div className="bg-menu__separator--transparent" />
          <div className="bg-menu__item row middle" onClick={handlePinColumn(PinType.RIGHT)}>
            Pin right
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
        <div className={cn("bg-menu__item__submenu column", horizontalSubmenuPosition)}>
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
      className={cn("bg-menu__container animate__animated animate__faster animate__fadeIn", horizontalPosition, theme)}
      style={{ top: coords.y, left: coords.x }}
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
