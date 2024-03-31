import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { BeastGridConfig } from '../../common';
import { BarChartIcon, CopyIcon, DownloadIcon } from '@radix-ui/react-icons';
import { FormattedMessage } from 'react-intl';

import cn from 'classnames';

import './context-menu.scss';

type Props<T> = {
    config: BeastGridConfig<T>;
    x: number;
    y: number;
    theme: string;
    visible: boolean;
    onClose: () => void;
    onCopy: (withHeaders: boolean) => void;
    onExport: () => void;
    onChartOpen: () => void;
};

export default function ContextMenu<T>(props: Props<T>) {
    if (!props.visible || !props.config.contextualMenu) {
        return null;
    }

    return createPortal(<MenuPortal {...props} />, document.body);
}

function MenuPortal<T>(props: Props<T>) {
    const { x, y, theme, onClose, onCopy, onExport, onChartOpen } = props;

    useEffect(() => {
        const body = document.body;

        body.addEventListener('click', onClose);

        return () => {
            body.removeEventListener('click', onClose);
        };
    }, [onClose]);

    const left = window.scrollX + x;
    const top = window.scrollY + y;

    const handleCopy = (withHeaders: boolean) => (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy(withHeaders);
    };

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExport();
    };

    const handleChart = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChartOpen();
    };

    return (
        <div className={cn('bg-grid__context-menu', theme)} style={{ left, top }}>
            <CopySection enabled={props.config.contextualMenu?.copy ?? true} onCopy={handleCopy} />
            <ChartSection enabled={props.config.contextualMenu?.chart ?? false} onChart={handleChart} />
            <ExportSection enabled={props.config.contextualMenu?.export ?? false} onExport={handleExport} />
        </div>
    );
}

const CopySection = ({
    enabled,
    onCopy,
}: {
    enabled: boolean;
    onCopy: (withHeaders: boolean) => (e: React.MouseEvent) => void;
}) => {
    if (!enabled) {
        return null;
    }
    return (
        <div className="bg-grid__context-menu__section">
            <div className="bg-grid__context-menu__item row middle" onClick={onCopy(false)}>
                <CopyIcon />
                <FormattedMessage id="menu.copy" />
            </div>
            <div className="bg-grid__context-menu__item row middle" onClick={onCopy(true)}>
                <CopyIcon />
                <FormattedMessage id="menu.copyWithHeaders" />
            </div>
        </div>
    );
};

const ChartSection = ({ enabled, onChart }: { enabled: boolean; onChart: (e: React.MouseEvent) => void }) => {
    if (!enabled) {
        return null;
    }
    return (
        <div className="bg-grid__context-menu__section" onClick={onChart}>
            <div className="bg-grid__context-menu__item row middle">
                <BarChartIcon />
                <FormattedMessage id="menu.chart" />
            </div>
        </div>
    );
};

const ExportSection = ({ enabled, onExport }: { enabled: boolean; onExport: (e: React.MouseEvent) => void }) => {
    if (!enabled) {
        return null;
    }
    return (
        <div className="bg-grid__context-menu__section" onClick={onExport}>
            <div className="bg-grid__context-menu__item row middle">
                <DownloadIcon />
                <FormattedMessage id="menu.export" />
            </div>
        </div>
    );
};
