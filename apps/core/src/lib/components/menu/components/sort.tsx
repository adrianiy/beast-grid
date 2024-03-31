import { MouseEventHandler } from 'react';
import { Column, SortType } from '../../../common';
import { useBeastStore } from '../../../stores/beast-store';
import { ArrowDownIcon, ArrowUpIcon, Cross1Icon } from '@radix-ui/react-icons';
import { FormattedMessage } from 'react-intl';

import cn from 'classnames';
import { PropsWithMouseEnter } from './sections';

export default function SortSection({
    column,
    multiSort,
    onMouseEnter,
}: PropsWithMouseEnter<{ column: Column; multiSort: boolean }>) {
    const [setSort, resetColumn] = useBeastStore((state) => [state.setSort, state.resetColumnConfig]);

    const handleSetSort =
        (sort: SortType): MouseEventHandler<HTMLDivElement> =>
        () => {
            setSort(column.id, sort, multiSort);
        };

    const handleResetColumn: MouseEventHandler<HTMLDivElement> = (e) => {
        e.stopPropagation();
        resetColumn(column.id);
    };

    if (!column.sortable) {
        return null;
    }

    if (!column.sort) {
        return (
            <div className="bg-menu__content column config" onMouseEnter={onMouseEnter}>
                <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.ASC)}>
                    <ArrowUpIcon className="small" />
                    <FormattedMessage id="menu.sort.asc" defaultMessage="Ascending" />
                </div>
                <div className={cn('bg-menu__item row middle')} onClick={handleSetSort(SortType.DESC)}>
                    <ArrowDownIcon className="small" />
                    <FormattedMessage id="menu.sort.desc" defaultMessage="Descending" />
                </div>
            </div>
        );
    } else {
        return (
            <div className="bg-menu__content column config" onMouseEnter={onMouseEnter}>
                <div
                    className={cn('bg-menu__item row middle')}
                    onClick={handleSetSort(column.sort?.order === SortType.ASC ? SortType.DESC : SortType.ASC)}
                >
                    {column.sort?.order === SortType.DESC ? (
                        <ArrowUpIcon className="small" />
                    ) : (
                        <ArrowDownIcon className="small" />
                    )}
                    {column.sort?.order === SortType.DESC ? 'Ascending' : 'Descending'}
                </div>
                <div className="bg-menu__item row middle" onClick={handleResetColumn}>
                    <Cross1Icon className="small" />
                    <FormattedMessage id="menu.sort.reset" defaultMessage="Reset" />
                </div>
            </div>
        );
    }
}
