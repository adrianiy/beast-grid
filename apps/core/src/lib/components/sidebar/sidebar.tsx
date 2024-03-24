import { useEffect, useState } from 'react';
import { BeastGridConfig, ChartType, Column, SideBarConfig } from '../../common';

import GridConfig from './components/grid';
import ChartConfig from './components/chart';
import Filters from './components/filters';

import { useBeastStore } from '../../stores/beast-store';

import './sidebar.scss';

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
}

function SideBarSwitch<T>({ sideBarConfig, config, ...chartProps }: { sideBarConfig: SideBarConfig; config: BeastGridConfig<T> } & Partial<ChartProps>) {
  const [columns] = useBeastStore((state) => [state.columns]);

  switch (sideBarConfig) {
    case SideBarConfig.GRID:
      return <GridConfig config={config} columns={columns} />;
    case SideBarConfig.FILTERS:
      return <Filters config={config} />;
    case SideBarConfig.CHART:
      return chartProps?.values && <ChartConfig config={config} {...chartProps} />;
    default:
      return null;
  }
}

export default function SideBar<T>({ config, ...chartProps }: { config: BeastGridConfig<T> } & Partial<ChartProps>) {
  const [sideBarConfig, setSidebarConfig] = useBeastStore((state) => [
    state.sideBarConfig,
    state.setSideBarConfig,
  ]);
  const [useModal, setUseModal] = useState<boolean>(false);

  useEffect(() => {
    if (sideBarConfig === SideBarConfig.FILTERS && config.style?.maxHeight) {
      setUseModal(true);
    } else {
      setUseModal(false);
    }
  }, [sideBarConfig, config.style?.maxHeight]);


  const closeSidebar = () => {
    setSidebarConfig(null);
    setUseModal(false);
  };

  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!sideBarConfig) {
    return null;
  }

  if (useModal) {
    return (
      <div className="bg-sidebar__modal__container" onClick={closeSidebar}>
        <div className="bg-sidebar__modal" onClick={stopClick}>
          <SideBarSwitch sideBarConfig={sideBarConfig} config={config} {...chartProps} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-sidebar__container">
        <SideBarSwitch sideBarConfig={sideBarConfig} config={config} {...chartProps} />
      </div>
    );
  }
}
