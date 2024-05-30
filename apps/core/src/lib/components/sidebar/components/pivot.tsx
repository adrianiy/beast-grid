import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDrag, useDrop } from 'react-dnd';

import { List, ListRowProps } from 'react-virtualized';

import SimpleBar from 'simplebar-react';

import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon, Cross2Icon, DotsVerticalIcon, DragHandleDots2Icon } from '@radix-ui/react-icons';

import { AggregationType, BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT } from '../../../common';

import { PivotState } from '../../../stores/grid-store/store';
import { useBeastStore } from '../../../stores/beast-store';
import { clone } from '../../../utils/functions';

import cn from 'classnames';

type Props<T> = {
    columns: ColumnStore;
    config: BeastGridConfig<T>;
};

export default function PivotConfig<T>({ columns, config }: Props<T>) {
    const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSearchValue(searchValue);
    };

    const options = Object.values(columns).filter((column) => column.final);

    return (
        <div className={cn('bg-sidebar bg-sidebar--big column', { border: config.style?.border })}>
            <div
                className="bg-sidebar__title row middle between"
                style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
            >
                <div className="row middle">
                    <FormattedMessage id="toolbar.pivot" />
                    <div className="bg-tag--beta">BETA</div>
                </div>
                <Cross2Icon onClick={() => setSidebar(null)} />
            </div>
            <div className="row top h-full overflow-hidden">
                <div className="column center h-full" style={{ width: 300 }}>
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
                <PivotOptions enabled={config.pivot?.enabled} />
            </div>
        </div>
    );
}

const ItemLabel = ({ item, style }: { item: Column; style: React.CSSProperties }) => {
    const [, drag] = useDrag(() => ({
        type: item.childrenId?.length ? 'PARENT' : 'COLUMN',
        item: { id: item.id },
    }));

    return (
        <div className="row middle bg-dimension__container" ref={drag} style={style}>
            <div className="bg-dimension row middle">
                <DragHandleDots2Icon />
                <label>{item.headerName}</label>
            </div>
        </div>
    );
};

function renderOption({
    options,
    searchValue,
    parentMatch,
}: {
    options: Column[];
    searchValue: string;
    parentMatch?: boolean;
}) {
    return function _renderOption({ key, index, style }: ListRowProps) {
        const item = options[index];

        const matchSearch = !searchValue || item.headerName.toLowerCase().includes(searchValue.toLowerCase());

        if (!matchSearch && !parentMatch) {
            return null;
        }

        return <ItemLabel key={key} style={style} item={item} />;
    };
}

const Options = ({
    options,
    parentMatch,
    searchValue,
}: {
    options: Column[];
    parentMatch?: boolean;
    paddingLeft?: string;
    columns: ColumnStore;
    searchValue: string;
}) => {
    const ref = useRef<List | null>(null);

    const rowHeight = () => {
        return 60;
    };

    return (
        <List
            ref={ref}
            height={600}
            width={300}
            style={{ padding: 'var(--bg-size--2) var(--bg-size--4)' }}
            rowHeight={rowHeight}
            rowCount={options.length}
            rowRenderer={renderOption({
                options,
                searchValue,
                parentMatch,
            })}
        />
    );
};

const PivotOptions = ({ enabled }: { enabled?: boolean }) => {
    const [setPivot] = useBeastStore((state) => [state.setPivot, state.pivot]);

    if (!enabled) {
        return null;
    }

    const handleRowChange = (rows: Column[]) => {
        setPivot({ rows });
    };

    const handleColumnChange = (columns: Column[]) => {
        setPivot({ columns });
    };

    const handleValueChange = (values: Column[]) => {
        setPivot({ values });
    };

    return (
        <SimpleBar className="bg-sidebar__pivot__container column fl-1">
            <PivotBox pivotType="rows" onChanges={handleRowChange} />
            <PivotBox pivotType="columns" onChanges={handleColumnChange} />
            <PivotBox pivotType="values" onChanges={handleValueChange} />
        </SimpleBar>
    );
};

const Box = ({
    column,
    index,
    isValue,
    onRemove,
    onHover,
}: {
    column: Column;
    index: number;
    isValue?: boolean;
    onRemove: (column: Column) => () => void;
    onHover: (index: number, hoverIndex: number) => void;
}) => {
    const [, drag] = useDrag(() => ({
        type: 'BOX',
        item: { id: column.id, index, onRemove },
        end: (_, monitor) => {
            if (!monitor.didDrop()) {
                onRemove(column)();
                return;
            }
        },
    }));

    const [, drop] = useDrop(() => ({
        accept: 'BOX',
        hover: (item: { index: number }) => {
            if (!ref.current) {
                return;
            }
            if (item.index === index) {
                return;
            }
            onHover(item.index, index);
        },
    }));

    const ref = useRef<HTMLDivElement>(null);

    drag(drop(ref));

    return (
        <div className="row middle bg-chip" ref={ref}>
            <DragHandleDots2Icon />
            <div className="row middle left fl-1">
                {isValue ? <label>{(column.aggregation as string) || 'sum'} of&nbsp; </label> : null}
                <label>{column.headerName}</label>
            </div>
            <div className="row middle">
                {column.aggregation ? <DotsVerticalIcon className="button" /> : null}
                <Cross2Icon onClick={onRemove(column)} className="button" />
            </div>
        </div>
    );
};

const PivotBox = ({ pivotType, onChanges }: { pivotType: string; onChanges: (columns: Column[]) => void }) => {
    const [columnStore, pivot, setPivot] = useBeastStore((state) => [
        state.initialColumns,
        state.pivot,
        state.setPivot,
    ]);
    const columns = useRef<Column[]>((pivot?.[pivotType.toLowerCase() as keyof PivotState] as Column[]) || []);

    const [, drop] = useDrop(() => ({
        accept: ['COLUMN', 'BOX'],
        drop: (item: { id: string; onRemove: (column: Column) => () => void }) => {
            if (columns.current.find((c) => c.id === item.id)) {
                return;
            }
            const column = clone(columnStore[item.id]);

            if (pivotType === 'values' && !column.aggregation) {
                column.aggregation = AggregationType.SUM;
            }

            const newState = columns.current.concat(clone(column));

            columns.current = newState;
            onChanges(columns.current);

            if (item.onRemove) {
                item.onRemove(column)();
            }
        },
    }));

    const removeColumn = (column: Column) => () => {
        columns.current = columns.current.filter((c) => c.id !== column.id);
        onChanges(columns.current);
    };

    const onHover = (index: number, hoverIndex: number) => {
        const dragColumn = columns.current[index];
        const hoverColumn = columns.current[hoverIndex];

        columns.current[index] = hoverColumn;
        columns.current[hoverIndex] = dragColumn;

        onChanges(columns.current);
    };

    const onColumnTotalsChange = () => {
        setPivot({ columnTotals: !pivot?.columnTotals });
    };

    const onRowTotalsChange = () => {
        setPivot({ rowTotals: !pivot?.rowTotals });
    };

    return (
        <div className="bg-box__container column left">
            <div className="bg-box__title row middle">
                <label>{pivotType}</label>
                {pivotType === 'rows' ? (
                    <div className="row middle" onClick={onRowTotalsChange}>
                        <Checkbox.Root className="bg-checkbox__root" checked={pivot?.rowTotals} id="rowTotals">
                            <Checkbox.Indicator className="bg-checbox__indicator row center middle">
                                <CheckIcon />
                            </Checkbox.Indicator>
                        </Checkbox.Root>
                        <label>Totals</label>
                    </div>
                ) : pivotType === 'columns' ? (
                    <div className="row middle center" onClick={onColumnTotalsChange}>
                        <Checkbox.Root className="bg-checkbox__root" checked={pivot?.columnTotals} id="columnTotals">
                            <Checkbox.Indicator className="bg-checbox__indicator row center middle">
                                <CheckIcon />
                            </Checkbox.Indicator>
                        </Checkbox.Root>
                        <label>Totals</label>
                    </div>
                ) : null}
            </div>
            <div className="bg-box column left" ref={drop}>
                {columns.current.map((column, idx) => (
                    <Box
                        key={`${pivotType}-${column.id}`}
                        index={idx}
                        column={column}
                        isValue={pivotType === 'values'}
                        onRemove={removeColumn}
                        onHover={onHover}
                    />
                ))}
            </div>
        </div>
    );
};
