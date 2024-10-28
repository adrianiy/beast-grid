import { useIntl } from 'react-intl';

import * as Checkbox from '@radix-ui/react-checkbox';

import { CheckIcon } from '@radix-ui/react-icons';

import { Column, IFilter } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';

type Props = {
    column: Column;
    filters: Record<string, IFilter[]>;
    scrollContainer: HTMLDivElement | null;
};

export default function BooleanFilter(props: Props) {
    const { column, filters } = props;
    const intl = useIntl();
    const [addFilter] = useBeastStore((state) => [state.addFilter]);

    const handleAddFilter = (value: IFilter) => (e: React.MouseEvent) => {
        e.stopPropagation();
        addFilter(column.id, `${value}`);
    };

    function renderOption(title: string, value: IFilter) {
        return (
            <div
                key={title}
                className={cn('bg-filter__item row middle')}
                onClick={handleAddFilter(value)}
            >
                <Checkbox.Root
                    className="bg-checkbox__root"
                    checked={!!filters[column.id]?.includes(`${value}`)}
                    id={column.id}
                >
                    <Checkbox.Indicator className="bg-checbox__indicator row middle center">
                        <CheckIcon />
                    </Checkbox.Indicator>
                </Checkbox.Root>
                <label>{value.toString()}</label>
            </div>

        )
    }

    return (
        <div className="bg-filter bg-filter__text">
            {renderOption(intl.formatMessage({ id: 'true' }), true)}
            {renderOption(intl.formatMessage({ id: 'false' }), false)}
        </div>
    );
}

