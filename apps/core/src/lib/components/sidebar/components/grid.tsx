import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';

import { BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT } from '../../../common';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import cn from 'classnames';
import Accordion from '../../accordion/accordion';
import { useDrag } from 'react-dnd';
import { List, ListRowProps } from 'react-virtualized';

type Props<T> = {
    columns: ColumnStore;
    config: BeastGridConfig<T>;
};

export default function GridConfig<T>({ columns, config }: Props<T>) {
    const ref = useRef<HTMLDivElement>(null);
    const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSearchValue(searchValue);
    };

    const options = Object.values(columns).filter((column) => column.level === 0);

    return (
        <div className={cn('bg-sidebar column', { border: config.style?.border })} ref={ref}>
            <div
                className="bg-sidebar__title row middle between"
                style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
            >
                <FormattedMessage id="toolbar.grid" />
                <Cross2Icon onClick={() => setSidebar(null)} />
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
                        <Options
                            options={options}
                            columns={columns}
                            searchValue={searchValue}
                            container={ref.current}
                        />
                    </SimpleBar>
                </div>
            </div>
        </div>
    );
}

const ItemLabel = ({
    item,
    checked,
    onClick,
}: {
    item: Column;
    checked: boolean;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => {
    const [, drag] = useDrag(() => ({
        type: item.childrenId?.length ? 'PARENT' : 'COLUMN',
        item: { id: item.id },
    }));

    return (
        <div className="row middle bg-option__container" ref={drag} onClick={onClick}>
            <Checkbox.Root className="bg-checkbox__root" checked={checked} id={item.id}>
                <Checkbox.Indicator className="bg-checbox__indicator row center middle">
                    <CheckIcon />
                </Checkbox.Indicator>
            </Checkbox.Root>
            <label>{item.headerName}</label>
        </div>
    );
};

function renderOption({
    options,
    columns,
    searchValue,
    parentMatch,
    someHasChildren,
    hiddenColumns,
    list,
    container,
    handleGridChange,
    handleExpand,
}: {
    options: Column[];
    columns: ColumnStore;
    searchValue: string;
    parentMatch?: boolean;
    someHasChildren: boolean;
    hiddenColumns: string[];
    list: React.MutableRefObject<List | null>;
    container: HTMLElement | null;
    handleGridChange: (column: Column) => (e: React.MouseEvent<HTMLDivElement>) => void;
    handleExpand: (expanded: boolean, index: number) => void;
}) {
    return function _renderOption({ key, index, style }: ListRowProps) {
        const item = options[index];

        const children = Object.values(columns).filter((c) => item.childrenId?.includes(c.id));
        const matchSearch = !searchValue || item.headerName.toLowerCase().includes(searchValue.toLowerCase());
        console.log(matchSearch, searchValue, item.headerName);
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
                key={key}
                id={`sidebar_grid_${item.id}`}
                hideArrow={!hasChildren}
                withoutArrow={!someHasChildren}
                style={style || {}}
                label={
                    <ItemLabel
                        item={item}
                        checked={!hiddenColumns.includes(item.id)}
                        onClick={handleGridChange(item)}
                    />
                }
                elements={children.length}
                onExpand={(expanded: boolean) => {
                    handleExpand(expanded, index);
                    list.current?.recomputeRowHeights();
                    list.current?.forceUpdate();
                }}
            >
                <Options options={children} parentMatch={matchSearch} columns={columns} searchValue={searchValue} container={container} />
            </Accordion>
        );
    };
}

const Options = ({
    options,
    parentMatch,
    columns,
    searchValue,
    container,
}: {
    options: Column[];
    parentMatch?: boolean;
    paddingLeft?: string;
    columns: ColumnStore;
    searchValue: string;
    container: HTMLElement | null;
}) => {
    const ref = useRef<List | null>(null);
    const expandedIndexes = useRef<number[]>([]);
    const [hideColumn, hiddenColumns] = useBeastStore((state) => [state.hideColumn, state.hiddenColumns]);

    const handleGridChange = (column: Column) => (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        hideColumn(column.id);
    };

    const handleExpand = (expanded: boolean, index: number) => {
        if (!options[index].childrenId?.length) {
            return;
        }
        if (expanded) {
            expandedIndexes.current.push(index);
        } else {
            expandedIndexes.current = expandedIndexes.current.filter((i) => i !== index);
        }
    };

    const someHasChildren = options.some((opt) => opt.childrenId?.length);

    const rowHeight = (props: { index: number }) => {
        const expanded = expandedIndexes.current.includes(props.index);

        if (expanded) {
            const children = Object.values(columns).filter((c) => options[props.index].childrenId?.includes(c.id));
            return 37 * children.length;
        } else {
            return 37;
        }
    };

    return (
        <List
            ref={ref}
            height={400}
            width={(container?.clientWidth || 100) - 10}
            rowHeight={rowHeight}
            rowCount={options.length}
            rowRenderer={renderOption({
                options,
                columns,
                searchValue,
                parentMatch,
                someHasChildren,
                hiddenColumns,
                list: ref,
                container,
                handleGridChange,
                handleExpand,
            })}
        />
    );
};

