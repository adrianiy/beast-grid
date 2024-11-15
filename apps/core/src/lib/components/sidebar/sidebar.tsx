import { useEffect, useMemo, useState } from 'react';
import { BeastGridConfig, ChartType, Column, SideBarConfig } from '../../common';

import GridConfig from './components/grid';
import ChartConfig from './components/chart';
import Filters from './components/filters';

import { useBeastStore } from '../../stores/beast-store';
import { createPortal } from 'react-dom';

import cn from 'classnames';

import './sidebar.scss';
import PivotConfig from './components/pivot';

type ChartProps = {
    categories: Column[];
    values: Column[];
    groups: Column[];
    activeCategory: Column;
    activeValues: Column[];
    activeGroups: Column[];
    activeChartType: ChartType;
    setActiveCategory: (column: Column) => void;
    setActiveValue: (column: Column) => void;
    setActiveGroup: (column: Column) => void;
    setActiveChartType: (chartType: ChartType) => void;
};

function SideBarSwitch<T>({
    sideBarConfig,
    config,
    onClose,
    ...chartProps
}: { sideBarConfig: SideBarConfig; onClose: () => void, config: BeastGridConfig<T> } & Partial<ChartProps>) {
    const [snapshots, columns] = useBeastStore((state) => [state.snapshots, state.columns]);

    const originalColumns = useMemo(() => {
        return snapshots[0]?.columns || [];
    }, [snapshots[0]?.columns]);


    switch (sideBarConfig) {
        case SideBarConfig.GRID:
            return <GridConfig config={config} columns={columns} />;
        case SideBarConfig.FILTERS:
            return <Filters config={config} />;
        case SideBarConfig.CHART:
            return chartProps?.values && <ChartConfig config={config} {...chartProps} />;
        case SideBarConfig.PIVOT:
            return <PivotConfig config={config} columns={originalColumns} onClose={onClose} />;
        default:
            return null;
    }
}

export default function SideBar<T>({ config, theme, ...chartProps }: { config: BeastGridConfig<T>, theme?: string } & Partial<ChartProps>) {
    const [sideBarConfig, setSidebarConfig, saveState] = useBeastStore((state) => [state.sideBarConfig, state.setSideBarConfig, state.saveState]);
    const [useModal, setUseModal] = useState<boolean>(false);

    useEffect(() => {
        const isModableSidebar = sideBarConfig && [SideBarConfig.FILTERS, SideBarConfig.GRID, SideBarConfig.PIVOT].includes(sideBarConfig);
        if (isModableSidebar && config.style?.maxHeight) {
            setUseModal(true);
        } else {
            setUseModal(false);
        }
    }, [sideBarConfig, config.style?.maxHeight]);

    const closeSidebar = () => {
        setSidebarConfig(null);
        setUseModal(false);
        saveState();
    };

    const stopClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!sideBarConfig) {
        return null;
    }

    if (config.appendModalToBoy) {
        return createPortal(
            <div
                className="bg-sidebar__modal__container animate__animated animate__faster animate__fadeIn corpo-theme"
                onClick={closeSidebar}
            >
                <div className="bg-sidebar__modal" onClick={stopClick}>
                    <SideBarSwitch sideBarConfig={sideBarConfig} config={config} onClose={closeSidebar} {...chartProps} />
                </div>
            </div>,
            document.body
        );
    } else if (useModal) {
        return (
            <div
                className={cn("bg-sidebar__modal__container animate__animated animate__faster animate__fadeIn", theme)}
                onClick={closeSidebar}
            >
                <div className="bg-sidebar__modal" onClick={stopClick}>
                    <SideBarSwitch sideBarConfig={sideBarConfig} config={config} onClose={closeSidebar} {...chartProps} />
                </div>
            </div>
        );
    } else {
        return (
            <div className="bg-sidebar__container">
                <SideBarSwitch sideBarConfig={sideBarConfig} config={config} onClose={closeSidebar} {...chartProps} />
            </div>
        );
    }
}
