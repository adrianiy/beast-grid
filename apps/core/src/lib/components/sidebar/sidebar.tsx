import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon, ChevronDownIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';
import SimpleBar from 'simplebar-react';

import { BeastGridConfig, Column, SideBarConfig } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';

import './sidebar.scss';

export default function SideBar<T>({ config }: { config: BeastGridConfig<T> }) {
  const [sideBarConfig, columns, hideColumn, setSidebar] = useBeastStore((state) => [
    state.sideBarConfig,
    state.columns,
    state.hideColumn,
    state.setSideBarConfig,
  ]);
  const [searchValue, setSearchValue] = useState('');

  const handleGridChange = (column: Column) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    hideColumn(column.id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    setSearchValue(searchValue);
  };

  const handleExpandRow = (id: string, children: number) => (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const arrow = document.getElementById(`bg-sidebar__arrow__${id}`);
    const element = document.getElementById(`bg-sidebar__children__${id}`);

    const prevState = element?.getAttribute('data-state') === 'open';

    if (!prevState) {
      element?.style.setProperty('height', `${37 * (children || 1)}px`);
      element?.removeAttribute('hidden');
    } else {
      element?.style.setProperty('height', '0px');
    }

    element?.setAttribute('data-state', prevState ? 'closed' : 'open');
    arrow?.classList.toggle('rotate');
  };

  const renderOptions = (_columns: Column[]) => {
    return _columns?.map((item, idx) => {
      const children = Object.values(columns).filter((c) => item.childrenId?.includes(c.id));

      return (
        <div
          data-state="open"
          className="bg-sidebar__item__wrapper column left"
          id={`sidebar_grid_${item.id}`}
          key={idx}
        >
          <div
            className="bg-sidebar__item row middle"
            style={{
              paddingLeft: `calc(${item.level + 1} * var(--bg-size--3))`,
              display:
                searchValue && !item.headerName.toLowerCase().includes(searchValue.toLowerCase())
                  ? 'none'
                  : 'flex',
            }}
          >
            <ChevronDownIcon
              id={`bg-sidebar__arrow__${item.id}`}
              className={cn('trigger', { disabled: !item.childrenId })}
              onClick={handleExpandRow(item.id, item.childrenId?.length || 0)}
            />
            <div className="bg-sidebar__item__header row middle"
            onClick={handleGridChange(item)}
            >
              <Checkbox.Root className="bg-checkbox__root" checked={!item.hidden} id={item.id}>
                <Checkbox.Indicator className="bg-checbox__indicator row center middle">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label>{item.headerName}</label>
            </div>
          </div>
          <div
            data-state="open"
            className="bg-sidebar__children"
            id={`bg-sidebar__children__${item.id}`}
            style={{ height: 37 * children.length }}
          >
            {renderOptions(children)}
          </div>
        </div>
      );
    });
  };

  const GridConfig = () => {
    return (
      <div className={cn('bg-sidebar column', { border: config.style?.border })}>
        <div className="bg-sidebar__close row middle center" onClick={() => setSidebar(null)}>
          <DoubleArrowRightIcon />
        </div>

        <input
          type="text"
          autoFocus
          placeholder="Search..."
          className="bg-sidebar__search"
          onChange={handleSearch}
        />
        <div className="bg-sidebar__separator" />
        <SimpleBar className="bg-sidebar__container column">
          {renderOptions(Object.values(columns).filter((column) => column.level === 0))}
        </SimpleBar>
      </div>
    );
  };

  switch (sideBarConfig) {
    case SideBarConfig.GRID:
      return <GridConfig />;
    default:
      return null;
  }
}
