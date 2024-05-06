import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { List } from 'react-virtualized';

import * as Checkbox from '@radix-ui/react-checkbox';

import { Column, IFilter } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import { CheckIcon, DividerHorizontalIcon } from '@radix-ui/react-icons';

import Input from '../input/input';

import cn from 'classnames';

import './menu-filters.scss';

type Props = {
    column: Column;
};

export default function TextFilters(props: Props) {
    const { column } = props;
    const intl = useIntl();
    const [searchValue, setSearchValue] = useState('');
    const [filterOptions, setFilterOptions] = useState<IFilter[]>([]);
    const [checked, setChecked] = useState<'indeterminate' | boolean>(false);
    const list = useRef<List | null>(null);

    const [filters, data, addFilter, selectAll] = useBeastStore((state) => [
        state.filters,
        state.data,
        state.addFilter,
        state.selectAllFilters,
    ]);

    useEffect(() => {
        const values = Array.from(new Set(data.map((row) => row[column.field as string]))).sort() as IFilter[];

        setFilterOptions(values);
    }, [data, column.field, setFilterOptions]);

    useEffect(() => {
        if (filters[column.id]?.length === filterOptions.length) {
            setChecked(true);
        } else if (!filters[column.id]?.length) {
            setChecked(false);
        } else {
            setChecked('indeterminate');
        }
    }, [filters, filterOptions, column.id, setChecked]);

    const handleFilterChange =
        (value: IFilter): MouseEventHandler<HTMLDivElement> =>
        () => {
            addFilter(column.id, value);
        };

    const handleSelectAll: MouseEventHandler<HTMLDivElement> = () => {
        selectAll(column.id, filterOptions);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSearchValue(searchValue);

        list.current?.recomputeRowHeights();
        list.current?.forceUpdate();
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    function renderOption({ key, index, style }: { key: string; index: number; style: React.CSSProperties }) {
        const item = filterOptions[index];

        if (!item) {
            return null;
        }

        return (
            <div
                key={key}
                className={cn('bg-filter__item row middle', {
                    hidden: searchValue && !(item as string).toLowerCase().includes(searchValue.toLowerCase()),
                })}
                style={style}
                onClick={handleFilterChange(item)}
            >
                <Checkbox.Root
                    className="bg-checkbox__root"
                    checked={!!filters[column.id]?.includes(item)}
                    id={column.id}
                >
                    <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                        <CheckIcon />
                    </Checkbox.Indicator>
                </Checkbox.Root>
                <label>{item as string}</label>
            </div>
        );
    }

    const rowHeihgt = ({ index }: { index: number }) => {
        const item = column.filterOptions?.[index];
        const inSearch = (item as string)?.toLowerCase().includes(searchValue.toLowerCase());

        return !searchValue || inSearch ? 40 : 0;
    };

    return (
        <div className="bg-filter bg-filter__text" onClick={handleClick}>
            <Input
                placeholder={intl.formatMessage({ id: 'filter.placeholder' })}
                className="bg-filter__search"
                onChange={handleSearch}
            />

            <div className="bg-filter__separator" />
            <List
                ref={list}
                height={200}
                width={245}
                rowCount={filterOptions.length}
                rowHeight={rowHeihgt}
                rowRenderer={renderOption}
            />
            <div className="bg-filter__separator" />
            <div className="bg-filter__item bg-menu__filter__item--big row middle" onClick={handleSelectAll}>
                <Checkbox.Root
                    className="bg-checkbox__root"
                    checked={checked}
                    onCheckedChange={setChecked}
                    id={column.id}
                >
                    <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                        {checked === 'indeterminate' && <DividerHorizontalIcon />}
                        {checked === true && <CheckIcon />}
                    </Checkbox.Indicator>
                </Checkbox.Root>
                <label>
                    <FormattedMessage id="filter.selectAll" />
                </label>
            </div>
        </div>
    );
}
