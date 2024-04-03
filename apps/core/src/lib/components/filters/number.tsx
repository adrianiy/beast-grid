import { Fragment, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Column, ColumnId, IFilter, NumberFilter, OperationType } from '../../common';

import Select, { Option } from '../select/select';

import { useBeastStore } from '../../stores/beast-store';
import { useDebounce, useThrottle } from '../../utils/functions';

const options = [
    { value: OperationType.NONE, label: <FormattedMessage id="filter.none" defaultMessage="None" /> },
    { value: OperationType.EQUAL, label: <FormattedMessage id="filter.equal" defaultMessage="Equal" /> },
    { value: OperationType.NOT_EQUAL, label: <FormattedMessage id="filter.notEqual" defaultMessage="Not Equal" /> },
    {
        value: OperationType.GREATER_THAN,
        label: <FormattedMessage id="filter.greaterThan" defaultMessage="Greater Than" />,
    },
    {
        value: OperationType.GREATER_THAN_OR_EQUAL,
        label: <FormattedMessage id="filter.greaterThanOrEqual" defaultMessage="Greater Than Or Equal" />,
    },
    { value: OperationType.LESS_THAN, label: <FormattedMessage id="filter.lessThan" defaultMessage="Less Than" /> },
    {
        value: OperationType.LESS_THAN_OR_EQUAL,
        label: <FormattedMessage id="filter.lessThanOrEqual" defaultMessage="Less Than Or Equal" />,
    },
];

const emptyFilter: NumberFilter = {
    op: undefined,
    value: undefined,
};

type Props = {
    column: Column;
    filters: Record<string, IFilter[]>;
    scrollContainer: HTMLDivElement | null;
};

export default function NumberFilter(props: Props) {
    const { column, filters, scrollContainer } = props;
    const [addFilter] = useBeastStore((state) => [state.addFilter]);

    const handleAddFilter = (idx: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        addFilter(column.id, emptyFilter, idx);
    };

    const renderButton = (idx: number) => {
        if (idx === 0 && filters[column.id]?.length === 1) {
            return (
                <div className="bg-filter__button" onClick={handleAddFilter(idx + 1)}>
                    AND
                </div>
            );
        }
        if (idx === 0 && filters[column.id]?.length === 2) {
            return <div className="bg-filter__button">AND</div>;
        }
    };

    return (
        <div className="bg-filter bg-filter__number">
            {(filters[column.id] || [emptyFilter]).map((filter, idx) => (
                <Fragment key={`${column.id}-filter-${idx}`}>
                    <FilterLine
                        idx={idx}
                        id={column.id}
                        filter={filter as NumberFilter}
                        scrollContainer={scrollContainer}
                    />
                    {renderButton(idx)}
                </Fragment>
            ))}
        </div>
    );
}

type LineProps = {
    id: ColumnId;
    idx: number;
    filter: NumberFilter;
    scrollContainer: HTMLDivElement | null;
};

const FilterLine = ({ id, idx, filter, scrollContainer }: LineProps) => {
    const [activeOption, setActiveOption] = useState<OperationType | undefined>(filter.op);
    const [inputValue, setInputValue] = useState<string | undefined>(filter.value?.toString() || '');

    const [addFilter, theme] = useBeastStore((state) => [state.addFilter, state.theme]);

    const throttle = useThrottle();
    const debounce = useDebounce();

    const handleSelectChange = (e: Option) => {
        if (!e || e.value === OperationType.NONE) {
            addFilter(id, null, idx);
            setInputValue(undefined);
            setActiveOption(undefined);
        } else {
            setActiveOption(e.value);

            if (inputValue) {
                addFilter(id, { op: e.value, value: Number(inputValue) }, idx);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (activeOption) {
            debounce(() => throttle(() => addFilter(id, { op: activeOption, value: Number(value) }, idx), 300), 300);
        }
    };

    const stopPropagation = (e: React.MouseEvent | React.UIEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div className="bg-filter__selector__container row middle">
            <Select
                label={<FormattedMessage id="filter.operation" />}
                activeOption={options.find((option) => option.value === activeOption)}
                options={options}
                theme={theme}
                container={scrollContainer}
                onChange={handleSelectChange}
            />
            <input
                type="number"
                className="bg-filter__input"
                onScroll={stopPropagation}
                onClick={stopPropagation}
                value={inputValue || ''}
                onChange={handleInputChange}
            />
        </div>
    );
};
