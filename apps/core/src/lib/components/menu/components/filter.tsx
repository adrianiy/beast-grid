import { Column, MenuHorizontalPosition, MenuProps } from '../../../common';

import { Filter } from '../../sidebar/components/filters';
import { FormattedMessage } from 'react-intl';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import { useBeastStore } from '../../../stores/beast-store';

import { SectionsEnum } from '../menu-layer';
import { PropsWithMouseEnter } from './sections';

import cn from 'classnames';

export default function FilterSection({
    column,
    horizontal,
    activeSection,
    onMouseEnter,
}: PropsWithMouseEnter<{
    column: Column;
    horizontal: MenuHorizontalPosition;
    activeSection: SectionsEnum | undefined;
}>) {
    const [filters] = useBeastStore((state) => [state.filters]);

    if (!column.menu || !(column.menu as MenuProps)?.filter) {
        return null;
    }

    const renderSubmenu = () => {
        if (activeSection !== SectionsEnum.FILTER) {
            return null;
        }

        return (
            <div className={cn('bg-menu__item__submenu column', horizontal)}>
                <Filter column={column} scrollContainer={null} />
            </div>
        );
    };

    return (
        <div className="bg-menu__content column filter" onMouseEnter={onMouseEnter}>
            <div className="bg-menu__item bg-menu__item--with-submenu row middle between">
                <div className="row middle left">
                    <div className="bg-menu__item__filler" />
                    <FormattedMessage id="menu.filter" defaultMessage="Filter" />
                    {filters[column.id] && <div className="bg-dot--active" />}
                </div>
                <ChevronRightIcon />
            </div>
            {renderSubmenu()}
        </div>
    );
}
