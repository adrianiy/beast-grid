import { useEffect, useRef, useState } from 'react';
import { BeastGridConfig, Column, ColumnStore, FilterType, HEADER_HEIGHT } from '../../../common';
import { FormattedMessage } from 'react-intl';

import { useBeastStore } from '../../../stores/beast-store';
import { Cross2Icon } from '@radix-ui/react-icons';
import Accordion from '../../accordion/accordion';
import TextFilters from '../../filters/text';
import NumberFilter from '../../filters/number';

import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';

import cn from 'classnames';
import { AutoSizer, List } from 'react-virtualized';

type Props<T> = {
    config: BeastGridConfig<T>;
};

export default function Filters<T>({ config }: Props<T>) {
    const ref = useRef<SimpleBarCore>(null);
    const [columns, setSidebar] = useBeastStore((state) => [state.columns, state.setSideBarConfig]);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (ref.current) {
            setScrollElement(ref.current.getScrollElement() as HTMLDivElement);
        }
    }, [ref]);

    return (
        <div className={cn('bg-sidebar column', { border: config.style?.border })}>
            <div
                className="bg-sidebar__title row middle between"
                style={{ minHeight: config.headerHeight || HEADER_HEIGHT }}
            >
                <FormattedMessage id="toolbar.filter" />
                <Cross2Icon onClick={() => setSidebar(null)} />
            </div>
            <SimpleBar className="bg-sidebar__content" ref={ref}>
                <Options
                    columns={Object.values(columns).filter((column) => column.level === 0)}
                    scrollContainer={scrollElement}
                />
            </SimpleBar>
        </div>
    );
}

export const Filter = ({ column, scrollContainer }: { column: Column; scrollContainer: HTMLDivElement | null }) => {
    const [filters] = useBeastStore((state) => [state.filters]);

    switch (column.filterType) {
        case FilterType.TEXT:
            return <TextFilters column={column} />;
        case FilterType.NUMBER:
            return <NumberFilter column={column} scrollContainer={scrollContainer} filters={filters} />;
        default:
            return null;
    }
};

const OptionLabel = ({ option }: { option: Column }) => {
    const [filters] = useBeastStore((state) => [state.filters]);

    return (
        <div className="bg-filter__label row middle">
            {option.headerName}
            {(filters[option.id] || option.childrenId?.some((id) => filters[id])) && <div className="bg-dot--active" />}
        </div>
    );
};

const renderOption = ({
    columns,
    columnStore,
    scrollContainer,
    list,
    handleRowExpand,
}: {
    columns: Column[];
    columnStore: ColumnStore;
    scrollContainer: HTMLDivElement | null;
    list: React.MutableRefObject<List | null>;
    handleRowExpand: (expanded: boolean, id: number) => void;
}) => {
    return function _renderOption({ index, key, style }: { key: string; index: number; style: React.CSSProperties }) {
        const option = columns[index];

        return (
            <Accordion
                key={key}
                id={`sidebar_filter_${option.id}`}
                label={<OptionLabel option={option} />}
                elements={option.childrenId ? option.childrenId.length : option.filterOptions?.length || 0}
                height={option.childrenId ? undefined : option.filterType === FilterType.TEXT ? 400 : 200}
                style={style}
                onExpand={(expanded) => {
                    handleRowExpand(expanded, index);
                    list.current?.recomputeRowHeights();
                    list.current?.forceUpdate();
                }}
            >
                {option.childrenId ? (
                    <Options
                        columns={option.childrenId.map((id) => columnStore[id])}
                        scrollContainer={scrollContainer}
                    />
                ) : (
                    <Filter column={option} scrollContainer={scrollContainer} />
                )}
            </Accordion>
        );
    };
};

const Options = ({ columns, scrollContainer }: { columns: Column[]; scrollContainer: HTMLDivElement | null }) => {
    const [columnStore] = useBeastStore((state) => [state.columns]);
    const list = useRef<List | null>(null);
    const expandedRows = useRef<number[]>([]);

    const handleRowExpand = (expanded: boolean, id: number) => {
        if (expanded) {
            expandedRows.current.push(id);
        } else {
            expandedRows.current = expandedRows.current.filter((row) => row !== id);
        }
    };

    const rowHeight = ({ index }: { index: number }) => {
        const option = columns[index];
        const expanded = expandedRows.current.includes(index);

        return expanded ? (option.filterType === FilterType.TEXT ? 400 : 200) : 40;
    };

    return (
        <AutoSizer>
            {({ width }) => (
                <List
                    ref={list}
                    height={400}
                    width={width}
                    rowCount={columns.length}
                    rowHeight={rowHeight}
                    rowRenderer={renderOption({ columns, columnStore, scrollContainer, list, handleRowExpand })}
                />
            )}
        </AutoSizer>
    );
};
