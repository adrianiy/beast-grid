import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';

import { AggregationType, BeastGridConfig, Column, ColumnStore, HEADER_HEIGHT } from '../../../common';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

import * as Checkbox from '@radix-ui/react-checkbox';

import SimpleBar from 'simplebar-react';

import cn from 'classnames';
import Accordion from '../../accordion/accordion';
import { useDrag, useDrop } from 'react-dnd';
import { PivotState } from '../../../stores/grid-store/store';
import { clone } from '../../../utils/functions';
import Select, { Option } from '../../select/select';

type Props<T> = {
    columns: ColumnStore;
    config: BeastGridConfig<T>;
};

export default function GridConfig<T>({ columns, config }: Props<T>) {
    const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);

    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSearchValue(searchValue);
    };

    const options = Object.values(columns).filter((column) => column.level === 0);

    return (
        <div className={cn('bg-sidebar column', { border: config.style?.border })}>
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
                        <Options options={options} columns={columns} searchValue={searchValue} />
                    </SimpleBar>
                </div>
                <PivotOptions enabled={config.pivot?.enabled} />
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
    const [hideColumn, hiddenColumns] = useBeastStore((state) => [state.hideColumn, state.hiddenColumns]);

    const handleGridChange = (column: Column) => (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        hideColumn(column.id);
    };

    const someHasChildren = options.some((opt) => opt.childrenId?.length);

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
                withoutArrow={!someHasChildren}
                label={
                    <ItemLabel
                        item={item}
                        checked={!hiddenColumns.includes(item.id)}
                        onClick={handleGridChange(item)}
                    />
                }
                elements={children.length}
            >
                <Options options={children} parentMatch={matchSearch} columns={columns} searchValue={searchValue} />
            </Accordion>
        );
    });
};

const PivotOptions = ({ enabled }: { enabled?: boolean }) => {
    const [setPivot] = useBeastStore((state) => [state.setPivot]);

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
    theme,
    isValue,
    scrollContainer,
    onRemove,
    onHover,
    onChanges,
}: {
    column: Column;
    index: number;
    theme: string;
    isValue?: boolean;
    scrollContainer: HTMLDivElement | null;
    onRemove: (column: Column) => () => void;
    onHover: (index: number, hoverIndex: number) => void;
    onChanges: () => void;
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
            <label>{column.headerName}</label>
            <AggSelection enabled={isValue} column={column} theme={theme} scrollContainer={scrollContainer} onChanges={onChanges} />
            <Cross2Icon onClick={onRemove(column)} />
        </div>
    );
};

const AggSelection = ({
    enabled,
    column,
    theme,
    scrollContainer,
    onChanges,
}: {
    enabled?: boolean;
    column: Column;
    theme: string;
    scrollContainer: HTMLDivElement | null;
    onChanges: () => void;
}) => {
    if (!enabled) {
        return null;
    }

    const options: Option[] = [
        { label: 'Sum', value: AggregationType.SUM },
        { label: 'Avg', value: AggregationType.AVG },
        { label: 'Count', value: AggregationType.COUNT },
        { label: 'Count Distinct', value: AggregationType.COUNT_DISTINCT},
        { label: 'Max', value: AggregationType.MAX },
        { label: 'Min', value: AggregationType.MIN },
    ];

    const handleChange = (e: Option) => {
        column.aggregation = e.value as AggregationType;
        onChanges();
    };

    return (
        <div className="bg-agg-selection row middle">
            <Select
                options={options}
                label={
                    <label>{column.aggregation as string}</label>
                }
                activeOption={options.find((opt) => opt.value === column.aggregation)}
                theme={theme}
                container={scrollContainer}
                onChange={handleChange}
            />
        </div>
    );
};

const PivotBox = ({ pivotType, onChanges }: { pivotType: string; onChanges: (columns: Column[]) => void }) => {
    const [columnStore, pivot, theme, scrollContainer] = useBeastStore((state) => [state.initialColumns, state.pivot, state.theme, state.scrollElement]);
    const columns = useRef<Column[]>((pivot?.[pivotType.toLowerCase() as keyof PivotState] as Column[]) || []);

    const [, drop] = useDrop(() => ({
        accept: ['COLUMN', 'BOX'],
        drop: (item: { id: string; onRemove: (column: Column) => () => void }) => {
            if (columns.current.find((c) => c.id === item.id)) {
                return;
            }
            const column = columnStore[item.id];

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

    const handleChanges = () => {
        onChanges(columns.current);
    }

    return (
        <div className="bg-box column left" ref={drop}>
            {columns.current.length ? (
                columns.current.map((column, idx) => (
                    <Box
                        key={`${pivotType}-${column.id}`}
                        index={idx}
                        column={column}
                        theme={theme}
                        isValue={pivotType === 'values'}
                        scrollContainer={scrollContainer}
                        onRemove={removeColumn}
                        onHover={onHover}
                        onChanges={handleChanges}
                    />
                ))
            ) : (
                <label>{pivotType}</label>
            )}
        </div>
    );
};
