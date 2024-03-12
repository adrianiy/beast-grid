import { useEffect, useState } from 'react';
import { BeastGridConfig, SideBarConfig } from '../../common';

import GridConfig from './components/grid';
import Filters from './components/filters';

import { useBeastStore } from '../../stores/beast-store';

import './sidebar.scss';

function SideBarSwitch<T>({ sideBarConfig, config }: { sideBarConfig: SideBarConfig; config: BeastGridConfig<T> }) {
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
