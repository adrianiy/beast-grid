import { FormattedMessage } from 'react-intl';
import { BusActions, Column, MenuProps } from '../../../common';
import { dispatch } from 'use-bus';
import { StackIcon } from '@radix-ui/react-icons';
import { capitalize } from '../../../utils/functions';
import { useBeastStore } from '../../../stores/beast-store';
import { PropsWithMouseEnter } from './sections';

export default function ColumnSection({
    column,
    onClose,
    onMouseEnter,
}: PropsWithMouseEnter<{ column: Column; onClose: () => void }>) {
    const [groupByColumn, ungroup] = useBeastStore((state) => [state.groupByColumn, state.unGroupColumn]);

    const handleGroupByColumn = () => {
        if (column.rowGroup) {
            ungroup(column.id);
        } else {
            groupByColumn(column.id);
        }
        onClose();
    };

    if (!column.menu || !(column.menu as MenuProps)?.column) {
        return null;
    }

    const extraColumnOptions = () => {
        if (!column.rowGroup) {
            return null;
        }

        return (
            <>
                <div className="bg-menu__item row middle between" onClick={() => dispatch(BusActions.EXPAND)}>
                    <div className="row middle left">
                        <div className="bg-menu__item__filler" />
                        <FormattedMessage id="menu.column.expand" defaultMessage="Expand all rows" />
                    </div>
                </div>
                <div className="bg-menu__item row middle between" onClick={() => dispatch(BusActions.COLLAPSE)}>
                    <div className="row middle left">
                        <div className="bg-menu__item__filler" />
                        <FormattedMessage id="menu.column.collapse" defaultMessage="Collapse all rows" />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="bg-menu__content column filter" onMouseEnter={onMouseEnter}>
            <div className="bg-menu__item row middle between" onClick={handleGroupByColumn}>
                <div className="row middle left">
                    <StackIcon />
                    {column.rowGroup && <div className="cross-overlay" />}
                    <FormattedMessage
                        id={column.rowGroup ? 'menu.column.ungroup' : 'menu.column.group'}
                        defaultMessage="Group by"
                        values={{ columnName: capitalize(column.headerName) }}
                    />
                </div>
            </div>
            {extraColumnOptions()}
        </div>
    );
}
