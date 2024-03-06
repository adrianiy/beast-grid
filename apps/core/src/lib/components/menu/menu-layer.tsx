import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  Cross1Icon,
  StackIcon,
  TableIcon,
} from '@radix-ui/react-icons';
import { dispatch } from 'use-bus';

import { useBeastStore } from '../../stores/beast-store';

import { BusActions, Column, MenuHorizontalPosition, MenuProps, PinType, SideBarConfig, SortType } from '../../common';
import MenuFilters from './menu-filters';
import { capitalize } from '../../utils/functions';

import cn from 'classnames';

import './menu-layer.scss';
import { getGroupedData } from '../../stores/grid-store/utils';

type Props = {
  visible: boolean;
  column: Column;
  theme: string;
  multiSort: boolean;
  horizontal: MenuHorizontalPosition;
  clipRef: () => SVGSVGElement;
  onClose: () => void;
};

export default function MenuLayer(props: Props) {
  if (!props.visible) {
    return null;
  }

  return createPortal(<HeaderMenu {...props} />, document.body);
}

function HeaderMenu({ column, multiSort, theme, horizontal, clipRef, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [horizontalPosition, setHorizontalPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [horizontalSubmenuPosition, setHorizontalSubmenuPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>({ x: 0, y: 0 });

  const [container, data, columns, setSort, resetColumn, pinColumn, setSidebar, setData] = useBeastStore((state) => [
    state.scrollElement,
    state.initialData,
    state.columns,
    state.setSort,
    state.resetColumnConfig,
    state.pinColumn,
    state.setSideBarConfig,
    state.setData,
  ]);

  useEffect(() => {
    const leftPinned = Object.values(columns)
      .filter((col) => col.pinned === PinType.LEFT)
      .reduce((acc, curr) => acc + curr.width, 0);

    const moveMenu = () => {
      if (!clipRef) {
        return;
      }

      const { left: cLeft, right: cRight } = container.getBoundingClientRect();
      const { width } = menuRef.current?.getBoundingClientRect() || {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
      };
      const { left, right, bottom } = clipRef().getBoundingClientRect();

      const x = window.scrollX + left;
      const y = window.scrollY + bottom + 8;

      setCoords({ x, y });

      if (right > cRight) {
        onClose();
        return;
      }
      if (left + width * 2 > cRight) {
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
      if (left < cLeft + leftPinned || x + width > cRight) {
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
    }, 400);

    document.addEventListener('click', closeMenu);
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

  const handlePinColumn = (pinType: PinType) => () => {
    pinColumn(column.id, column.pinned === pinType ? PinType.NONE : pinType);
    onClose();
  };

  const showConfig = () => {
    onClose();
    setSidebar(SideBarConfig.GRID);
  };

  const handleGroupByColumn = () => {
    if (!column.aggregationLevel) {
      const maxAggLevel = Math.max(...Object.values(columns).map((col) => col.aggregationLevel || 0));
      column.aggregationLevel = maxAggLevel + 1;
    } else {
      dispatch(BusActions.COLLAPSE);
      delete column.aggregationLevel;
    }
    const _data = getGroupedData(columns, data);

    setData(_data);
    onClose();
  };

  const renderSort = () => {
    if (!column.sortable) {
      return null;
    }
    if (!column.sort) {
      return (
        <div className="bg-menu__content column config">
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.ASC)}>
            <ArrowUpIcon className="small" />
            <FormattedMessage id="menu.sort.asc" defaultMessage="Ascending" />
          </div>
          <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.DESC)}>
            <ArrowDownIcon className="small" />
            <FormattedMessage id="menu.sort.desc" defaultMessage="Descending" />
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
            {column.sort?.order === SortType.DESC ? (
              <ArrowUpIcon className="small" />
            ) : (
              <ArrowDownIcon className="small" />
            )}
            {column.sort?.order === SortType.DESC ? 'Ascending' : 'Descending'}
          </div>
          <div className="bg-menu__item row middle" onClick={handleResetColumn}>
            <Cross1Icon className="small" />
            <FormattedMessage id="menu.sort.reset" defaultMessage="Reset" />
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
          <div className="row middle left">
            <div className="bg-menu__item__filler" />
            <FormattedMessage id="menu.pin.pin" defaultMessage="Pin" />
          </div>
          <ChevronRightIcon />
        </div>
        <div className="bg-menu__separator" />
        <div className={cn('bg-menu__item__submenu column', horizontalSubmenuPosition)}>
          <div className="bg-menu__item row middle between" onClick={handlePinColumn(PinType.LEFT)}>
            <FormattedMessage id="menu.pin.left" defaultMessage="Pin left" />
            {column.pinned === PinType.LEFT ? <CheckIcon /> : null}
          </div>
          <div className="bg-menu__separator--transparent" />
          <div className="bg-menu__item row middle" onClick={handlePinColumn(PinType.RIGHT)}>
            <FormattedMessage id="menu.pin.right" defaultMessage="Pin right" />
            {column.pinned === PinType.RIGHT ? <CheckIcon /> : null}
          </div>
        </div>
      </div>
    );
  };

  // grid columns visibility configuration
  const renderGridConfig = () => {
    if (!column.menu || !(column.menu as MenuProps)?.grid) {
      return null;
    }
    return (
      <div className="bg-menu__content column filter">
        <div className="bg-menu__item bg-menu__item--with-submenu row middle between" onClick={showConfig}>
          <div className="row middle left">
            <TableIcon />
            <FormattedMessage id="menu.grid" defaultMessage="Grid configuration" />
          </div>
        </div>
        <div className="bg-menu__separator" />
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
          <div className="row middle left">
            <div className="bg-menu__item__filler" />
            <FormattedMessage id="menu.filter" defaultMessage="Filter" />
          </div>
          <ChevronRightIcon />
        </div>
        <div className="bg-menu__separator" />
        <div className={cn('bg-menu__item__submenu column', horizontalSubmenuPosition)}>
          <MenuFilters column={column} />
        </div>
      </div>
    );
  };

  const renderColumnOptions = () => {
    if (!column.menu || !(column.menu as MenuProps)?.column) {
      return null;
    }

    const extraColumnOptions = () => {
      if (!column.aggregationLevel) {
        return null;
      }

      return (
        <>
          <div className="bg-menu__item row middle between" onClick={() => dispatch(BusActions.EXPAND)}>
            <div className="row middle left">
              <div className="bg-menu__item__filler" />
              <FormattedMessage id="menu.column.expand" defaultMessage="Expand all rows" />
            </div>
          </div>
          <div className="bg-menu__item row middle between" onClick={() => dispatch(BusActions.COLLAPSE)}>
            <div className="row middle left">
              <div className="bg-menu__item__filler" />
              <FormattedMessage id="menu.column.collapse" defaultMessage="Collapse all rows" />
            </div>
          </div>
        </>
      );
    };

    return (
      <div className="bg-menu__content column filter">
        <div className="bg-menu__item row middle between" onClick={handleGroupByColumn}>
          <div className="row middle left">
            <StackIcon />
            {column.aggregationLevel && <div className="cross-overlay" />}
            <FormattedMessage
              id={column.aggregationLevel ? 'menu.column.ungroup' : 'menu.column.group'}
              defaultMessage="Group by"
              values={{ columnName: capitalize(column.headerName) }}
            />
          </div>
        </div>
        {extraColumnOptions()}
        <div className="bg-menu__separator" />
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        'bg-menu__container animate__animated animate__faster animate__fadeIn',
        horizontalPosition,
        theme
      )}
      style={{ top: coords?.y, left: coords?.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-menu__wrapper animate__animated animate__faster animate__fadeInDown">
        {renderSort()}
        {renderPin()}
        {renderFilter()}
        {renderGridConfig()}
        {renderColumnOptions()}
      </div>
    </div>
  );
}
