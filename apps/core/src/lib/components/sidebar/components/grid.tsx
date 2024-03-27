import { Fragment, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';

import { BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT } from '../../../common';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import cn from 'classnames';
import Accordion from '../../accordion/accordion';
import { useDrag, useDrop } from 'react-dnd';

type Props<T> = {
  columns: ColumnStore;
  config: BeastGridConfig<T>;
};

export default function GridConfig<T>({ columns, config }: Props<T>) {
  const [pivot, setSidebar, setPivot] = useBeastStore((state) => [state.pivot, state.setSideBarConfig, state.setPivot]);

  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;

    setSearchValue(searchValue);
  };

  const togglePivotMode = () => {
    if (pivot?.enabled) {
      setPivot(null);
    } else {
      setPivot({ enabled: true });
    }

  };

  const options = Object.values(columns).filter((column) => column.level === 0);

  return (
    <div className={cn('bg-sidebar column', { border: config.style?.border })}>
      <div
        className="bg-sidebar__title row middle between"
        style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
      >
        <FormattedMessage id="toolbar.grid" />
        <div className="row middle">
          <div className="row middle pivot" onClick={togglePivotMode}>
            <FormattedMessage id="sidebar.pivot" />
          </div>
          <Cross2Icon onClick={() => setSidebar(null)} />
        </div>
      </div>
      <div className="row top h-full overflow-hidden">
        <div className="column fl-1 h-full">
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
        <PivotOptions enabled={pivot?.enabled} />
      </div>
    </div>
  );
}

const ItemLabel = ({ item, onClick }: { item: Column; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
  const [, drag] = useDrag(() => ({
    type: 'COLUMN',
    item: { id: item.id },
  }));

  return (
    <div className="row middle bg-option__container" ref={drag}>
      <Checkbox.Root className="bg-checkbox__root" checked={!item.hidden} id={item.id} onClick={onClick}>
        <Checkbox.Indicator className="bg-checbox__indicator row center middle">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label>{item.headerName}</label>
    </div>
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

const PivotOptions = ({ enabled }: { enabled?: boolean }) => {
  const [pivot, setPivot] = useBeastStore((state) => [state.pivot, state.setPivot]);
  
  if (!enabled) {
    return null;
  }

  const handleRowChange = (columns: Column[]) => {
    setPivot({ ...pivot, rows: columns });
  }

  const handleColumnChange = (columns: Column[]) => {
    setPivot({ ...pivot, columns });
  }

  const handleValueChange = (columns: Column[]) => {
    setPivot({ ...pivot, values: columns });
  }

  return (
    <SimpleBar className="bg-sidebar__pivot__container column fl-1">
      <PivotBox pivotType="Row" onChanges={handleRowChange} />
      <PivotBox pivotType="Column" onChanges={handleColumnChange} />
      <PivotBox pivotType="Value" onChanges={handleValueChange} />
    </SimpleBar>
  );
};

const PivotBox = ({
  pivotType,
  onChanges
}: {
  pivotType: string,
    onChanges: (columns: Column[]) => void;
}) => {
  const [columnStore] = useBeastStore((state) => [state.columns]);
  const [columns, setColumns] = useState<Column[]>([]);
  
  const [, drop] = useDrop(() => ({
    accept: 'COLUMN',
    drop: (item: { id: string }) => {
      const column = columnStore[item.id];

      const newState = [...columns, column];
      
      setColumns(newState);
      onChanges(newState);
    },
  }));

  return (
    <div className="bg-box column left" ref={drop}>
      { columns.length ? columns.map((column) => (
        <div className="row middle bg-chip">
          <label>{column.headerName}</label>
          <Cross2Icon onClick={() => setColumns((prev) => prev.filter((c) => c.id !== column.id))} />
        </div>
      )) : (
        <label>{pivotType}</label>
      )}
    </div>
  )
}
