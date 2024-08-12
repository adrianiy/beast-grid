import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDrag, useDrop } from 'react-dnd';

import { List, ListRowProps } from 'react-virtualized';

import SimpleBar from 'simplebar-react';

import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon, Cross2Icon, DotsVerticalIcon, DragHandleDots2Icon } from '@radix-ui/react-icons';

import { AggregationType, BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT, PivotState } from '../../../common';

import { useBeastStore } from '../../../stores/beast-store';
import { clone } from '../../../utils/functions';

import { Options as SelectOptions } from '../../select/select';

import cn from 'classnames';

type Props<T> = {
    columns: ColumnStore;
    config: BeastGridConfig<T>;
    onClose: () => void;
};

export default function PivotConfig<T>({ columns, config, onClose }: Props<T>) {
    const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSearchValue(searchValue);
    };

    const options = Object.values(columns).filter((column) => column.final && !column.hidden);

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
                <PivotOptions
                    enabled={config.pivot?.enabled}
                    applyButton={config.pivot?.applyButton}
                    totalizable={config.pivot?.totalizable}
                    onClose={onClose}
                />
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
            height={620}
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

const ActionButtons = ({
    enabled,
    onApply,
    onReset,
}: {
    enabled?: boolean;
    onApply: () => void;
    onReset: () => void;
}) => {
    if (!enabled) {
        return null;
    }

    return (
        <div className="bg-button__container row between">
            <div className="bg-button bg-sidebar__apply row middle center" onClick={onReset}>
                <label>Reset</label>
            </div>
            <div className="bg-button bg-sidebar__apply row middle center" onClick={onApply}>
                <label>Apply</label>
            </div>
        </div>
    );
};

const PivotOptions = ({
    enabled,
    applyButton,
    totalizable,
    onClose
}: {
    enabled?: boolean;
    applyButton?: boolean;
    totalizable?: boolean;
    onClose: () => void;
}) => {
    const rowBox = useRef<PivotBoxHandle>(null);
    const columnBox = useRef<PivotBoxHandle>(null);
    const valueBox = useRef<PivotBoxHandle>(null);
    const [pivot, setPivot] = useBeastStore((state) => [state.pivot, state.setPivot]);
    const [pivotState, setPivotState] = useState<Partial<PivotState> | undefined>(pivot);

    if (!enabled) {
        return null;
    }

    const handleRowChange = (newState: Partial<PivotState>) => {
        if (!applyButton) {
            setPivot({ rows: newState.columns });
        } else {
            setPivotState((state) => ({ ...state, rows: newState.columns } as PivotState));
        }
    };

    const handleColumnChange = (newState: Partial<PivotState>) => {
        if (!applyButton) {
            setPivot({ columns: newState.columns });
        } else {
            setPivotState((state) => ({ ...state, columns: newState.columns } as PivotState));
        }
    };

    const handleValueChange = (newState: Partial<PivotState>) => {
        if (!applyButton) {
            setPivot({ values: newState.columns });
        } else {
            setPivotState((state) => ({ ...state, values: newState.columns } as PivotState));
        }
    };

    const handleRowTotalChanges = (newState: Partial<PivotState>) => {
        if (!applyButton) {
            setPivot({ rowTotals: newState.rowTotals });
            setPivotState((state) => ({ ...state, rowTotals: newState.rowTotals } as PivotState));
        } else {
            setPivotState((state) => ({ ...state, rowTotals: newState.rowTotals } as PivotState));
        }
    };

    const handleColumnTotalChanges = (newState: Partial<PivotState>) => {
        if (!applyButton) {
            setPivot({ columnTotals: newState.columnTotals });
            setPivotState((state) => ({ ...state, columnTotals: newState.columnTotals } as PivotState));
        } else {
            setPivotState((state) => ({ ...state, columnTotals: newState.columnTotals } as PivotState));
        }
    };

    const onApply = () => {
        setPivot(pivotState as PivotState);
        onClose();
    };

    const onReset = () => {
        setPivotState({} as PivotState);
        rowBox.current?.resetBox();
        columnBox.current?.resetBox();
        valueBox.current?.resetBox();
    };

    return (
        <SimpleBar className="bg-sidebar__pivot__container column fl-1">
            <PivotBox
                ref={rowBox}
                rowTotals={!!pivotState?.rowTotals}
                pivotType="rows"
                totalizable={totalizable}
                onChanges={handleRowChange}
                onTotalChanges={handleRowTotalChanges}
            />
            <PivotBox
                ref={columnBox}
                columnTotals={!!pivotState?.columnTotals}
                pivotType="columns"
                totalizable={totalizable}
                onChanges={handleColumnChange}
                onTotalChanges={handleColumnTotalChanges}
            />
            <PivotBox ref={valueBox} pivotType="values" onChanges={handleValueChange} />
            <ActionButtons enabled={applyButton} onApply={onApply} onReset={onReset} />
        </SimpleBar>
    );
};

const Box = ({
    column,
    index,
    isValue,
    theme,
    scrollContainer,
    onRemove,
    onHover,
    onChanges,
}: {
    column: Column;
    index: number;
    isValue?: boolean;
    theme: string;
    scrollContainer: HTMLDivElement | null;
    onRemove: (column: Column) => () => void;
    onHover: (index: number, hoverIndex: number) => void;
    onChanges: () => void;
}) => {
    const inputRef = useRef<HTMLDivElement>(null);
    const [showSubmenu, setShowSubmenu] = useState(false);
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

    const renderSubmenu = () => {
        const options = [
            { label: 'Sum', value: AggregationType.SUM },
            { label: 'Count', value: AggregationType.COUNT },
            { label: 'Average', value: AggregationType.AVG },
            { label: 'Min', value: AggregationType.MIN },
            { label: 'Max', value: AggregationType.MAX },
        ];
        if (!showSubmenu) {
            return null;
        }
        const activeOption = options.find((o) => o.value === column.aggregation);

        return (
            <SelectOptions
                open={showSubmenu}
                theme={theme}
                inputRef={inputRef.current}
                container={scrollContainer}
                options={options}
                activeOption={activeOption}
                onClick={(option) => {
                    column.aggregation = option.value as AggregationType;
                    setShowSubmenu(false);
                    onChanges();
                }}
                onClose={() => setShowSubmenu(false)}
            />
        );
    };

    return (
        <div className="row middle bg-chip" ref={ref}>
            <DragHandleDots2Icon />
            <div className="row middle left fl-1">
                {isValue ? <label>[{(column.aggregation as string) || 'sum'}] &nbsp; </label> : null}
                <label>{column.headerName}</label>
            </div>
            <div className="row middle">
                <div className="row middle bg-submenu__container" ref={inputRef}>
                    {column.aggregation ? (
                        <DotsVerticalIcon className="button" onClick={() => setShowSubmenu(!showSubmenu)} />
                    ) : null}
                    {renderSubmenu()}
                </div>
                <Cross2Icon onClick={onRemove(column)} className="button" />
            </div>
        </div>
    );
};

interface PivotBoxHandle {
    resetBox: () => void
}

interface PivotProps {
    pivotType: string;
    rowTotals?: boolean;
    columnTotals?: boolean;
    totalizable?: boolean;
    onChanges: (state: Partial<PivotState>) => void;
    onTotalChanges?: (state: Partial<PivotState>) => void;
}

const PivotBox = forwardRef<PivotBoxHandle, PivotProps>(
    (
        {
            pivotType,
            rowTotals,
            columnTotals,
            totalizable,
            onChanges,
            onTotalChanges,
        },
        ref
    ) => {
        const [snapshots, pivot, theme, scrollContainer] = useBeastStore((state) => [
            state.snapshots,
            state.pivot,
            state.theme,
            state.scrollElement,
        ]);
        const columns = useRef<Column[]>((pivot?.[pivotType.toLowerCase() as keyof PivotState] as Column[]) || []);
        const columnStore = snapshots[0].columns;

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

                onChanges({ columns: columns.current });

                if (item.onRemove) {
                    item.onRemove(column)();
                }
            },
        }));


        const removeColumn = (column: Column) => () => {
            columns.current = columns.current.filter((c) => c.id !== column.id);

            onChanges({ columns: columns.current });
        };

        const onHover = (index: number, hoverIndex: number) => {
            const dragColumn = columns.current[index];
            const hoverColumn = columns.current[hoverIndex];

            columns.current[index] = hoverColumn;
            columns.current[hoverIndex] = dragColumn;

            onChanges({ columns: columns.current });
        };

        const onColumnTotalsChange = () => {
            onTotalChanges?.({ columnTotals: !pivot?.columnTotals });
        };

        const onRowTotalsChange = () => {
            onTotalChanges?.({ rowTotals: !pivot?.rowTotals });
        };

        const onChangeColumn = () => {
            onChanges({ columns: columns.current });
        };

        useImperativeHandle(ref, () => ({
            resetBox() {
                columns.current = [];
            },
        }));

        return (
            <div className="bg-box__container column left">
                <div className="bg-box__title row middle">
                    <label>{pivotType}</label>
                    {totalizable && pivotType === 'rows' ? (
                        <div className="row middle" onClick={onRowTotalsChange}>
                            <Checkbox.Root className="bg-checkbox__root" checked={rowTotals} id="rowTotals">
                                <Checkbox.Indicator className="bg-checbox__indicator row center middle">
                                    <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <label>Totals</label>
                        </div>
                    ) : totalizable && pivotType === 'columns' ? (
                        <div className="row middle center" onClick={onColumnTotalsChange}>
                            <Checkbox.Root className="bg-checkbox__root" checked={columnTotals} id="columnTotals">
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
                            theme={theme}
                            scrollContainer={scrollContainer}
                            onChanges={onChangeColumn}
                            onRemove={removeColumn}
                            onHover={onHover}
                        />
                    ))}
                </div>
            </div>
        );
    }
);
