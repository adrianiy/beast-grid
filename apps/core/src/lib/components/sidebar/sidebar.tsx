import { useEffect, useState } from 'react';
import { BeastGridConfig, SideBarConfig } from '../../common';

import GridConfig from './components/grid';
import Filters from './components/filters';

import { useBeastStore } from '../../stores/beast-store';

import './sidebar.scss';

function SideBarSwitch<T>({ sideBarConfig, config }: { sideBarConfig: SideBarConfig, config: BeastGridConfig<T> }) {
  const [columns] = useBeastStore((state) => [state.columns]);
  
  switch (sideBarConfig) {
    case SideBarConfig.GRID:
      return <GridConfig config={config} columns={columns} />;
    case SideBarConfig.FILTERS:
      return <Filters config={config} />;
    default:
      return null;
  }
}

export default function SideBar<T>({ config }: { config: BeastGridConfig<T> }) {
  const [container, filters, sideBarConfig, setSidebarConfig] = useBeastStore((state) => [
    state.scrollElement,
    state.filters,
    state.sideBarConfig,
    state.setSideBarConfig
  ]);
  const [useModal, setUseModal] = useState(false);

  useEffect(() => {
    if (container) {
      setTimeout(() => {
        setUseModal(container.getBoundingClientRect().height < 300);
      }, 100);
    }
  }, [sideBarConfig])

  useEffect(() => {
    if (container && !useModal) {
      setTimeout(() => {
        setUseModal(container.getBoundingClientRect().height < 300);
      }, 100);
    }
  }, [container, filters])

  const closeSidebar = () => {
    setSidebarConfig(null);
  }

  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  if (!sideBarConfig) {
    return null;
  }

  if (useModal) {
    return (
      <div className="bg-sidebar__modal__container" onClick={closeSidebar}>
        <div className="bg-sidebar__modal" onClick={stopClick}>
          <SideBarSwitch sideBarConfig={sideBarConfig} config={config} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-sidebar__container">
        <SideBarSwitch sideBarConfig={sideBarConfig} config={config} />
      </div>
    );
  }
}

