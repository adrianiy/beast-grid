import { FormattedMessage } from 'react-intl';
import { Column, MenuProps, SideBarConfig } from '../../../common';
import { TableIcon } from '@radix-ui/react-icons';
import { useBeastStore } from '../../../stores/beast-store';
import { PropsWithMouseEnter } from './sections';

export default function GridSection({
    column,
    onClose,
    onMouseEnter,
}: PropsWithMouseEnter<{ column: Column; onClose: () => void }>) {
    const [setSidebar] = useBeastStore((state) => [state.setSideBarConfig]);
    const showConfig = () => {
        onClose();
        setSidebar(SideBarConfig.GRID);
    };

    if (!column.menu || !(column.menu as MenuProps)?.grid) {
        return null;
    }

    return (
        <div className="bg-menu__content column filter" onMouseEnter={onMouseEnter}>
            <div className="bg-menu__item bg-menu__item--with-submenu row middle between" onClick={showConfig}>
                <div className="row middle left">
                    <TableIcon />
                    <FormattedMessage id="menu.grid" defaultMessage="Grid configuration" />
                </div>
            </div>
        </div>
    );
}
