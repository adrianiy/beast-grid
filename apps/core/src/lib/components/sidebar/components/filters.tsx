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
import { getColumnFilter } from '../../../stores/grid-store/utils';

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
            <SimpleBar className="bg-sidebar__content" ref={ref} style={{ height: 400 }}>
                <Options
                    columns={Object.values(columns).filter((column) => column.level === 0)}
                    scrollContainer={scrollElement}
                />
            </SimpleBar>
        </div>
    );
}

export const Filter = ({ column, scrollContainer }: { column: Column; scrollContainer: HTMLDivElement | null }) => {
    const [filters, data] = useBeastStore((state) => [state.filters, state.data]);

    if (!column.filterType) {
        getColumnFilter(column, data);
    }

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

const RenderOption = ({
    option,
    columnStore,
    scrollContainer,
    handleRowExpand,
}: {
    option: Column;
    columnStore: ColumnStore;
    scrollContainer: HTMLDivElement | null;
    handleRowExpand: (expanded: boolean) => void;
}) => {
    return <Accordion
        id={`sidebar_filter_${option.id}_${option.parent}`}
        label={<OptionLabel option={option} />}
        elements={option.childrenId?.length ? option.childrenId.length : option.filterOptions?.length || 0}
        height={400}
        onExpand={(expanded) => {
            handleRowExpand(expanded);
        }}
    >
        {option.childrenId?.length ? (
            <Options
                columns={option.childrenId.map((id) => columnStore[id])}
                scrollContainer={scrollContainer}
            />
        ) : (
            <Filter column={option} scrollContainer={scrollContainer} />
        )}
    </Accordion>
};

const Options = ({ columns, scrollContainer }: { columns: Column[]; scrollContainer: HTMLDivElement | null }) => {
    const [columnStore] = useBeastStore((state) => [state.columns]);
    const expandedRows = useRef<number[]>([]);

    const handleRowExpand = (id: number) => (expanded: boolean) => {
        if (expanded) {
            if (!expandedRows.current.includes(id)) {
                expandedRows.current.push(id);
            }
        } else {
            expandedRows.current = expandedRows.current.filter((row) => row !== id);
        }
    };

    return (
        <div className="bg-filter__options column">
            {
                columns.map((column, idx) => <RenderOption key={idx} option={column} columnStore={columnStore} scrollContainer={scrollContainer} handleRowExpand={handleRowExpand(idx)} />)
            }
        </div>
    );
};
