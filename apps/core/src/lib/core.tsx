import { MutableRefObject, useEffect, useRef, useState } from 'react';

import Header from './components/header/header';
import TBody from './components/body/tbody';

import { BeastGridApi, BeastGridConfig, Column, Data } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';

import { BeastGridProvider, BeastApi } from './stores/beast-store';

import { DndStoreProvider } from './stores/dnd-store';
import { MenuStoreProvider } from './stores/menu-store';

import { TGridStore, createGridStore } from './stores/grid-store/store';
import { TMenuStore, createMenuStore } from './stores/menu-store/store';
import { TDndStore, createDndStore } from './stores/dnd-store/store';


import LoaderLayer, { Loader } from './components/loader/loader';
import MenuLayer from './components/menu/menu-layer';

import cn from 'classnames';

import './core.scss';
import DndLayer from './components/dnd/dnd-layer';

export const defaultConfig = {
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
};

export function BeastGrid<T>({
  config,
  theme = 'default',
  api,
  onSortChange,
}: {
  config?: BeastGridConfig<T>;
  theme?: string;
  api?: MutableRefObject<BeastGridApi | undefined>;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [[beastGridStore, beastDndStore, menuStore], setStores] = useState<
    [TGridStore | null, TDndStore | null, TMenuStore | null]
  >([null, null, null]);

    useEffect(() => {
    if (ref.current && config?.columnDefs) {
      const gridStore: TGridStore = () => createGridStore(config, ref.current as HTMLDivElement);
      const dndStore = () => createDndStore();
      const menuStore = () => createMenuStore();

      setStores([gridStore, dndStore, menuStore]);
    }
  }, [ref, config]);

  const renderGrid = () => {
    if (!config || !beastGridStore || !beastDndStore || !menuStore) {
      return <Loader />;
    }

    return (
      <DndStoreProvider createStore={beastDndStore}>
        <MenuStoreProvider createStore={menuStore}>
          <BeastGridProvider createStore={beastGridStore}>
            <BeastApi store={api} />
            <DndLayer />
            <LoaderLayer />
            <MenuLayer />
            <Header
              height={config.header?.height || defaultConfig.headerHeight}
              border={config.header?.border ?? true}
              multiSort={config.sort?.multiple}
              dragOptions={config.dragOptions}
            />
            <TBody
              rowHeight={config.row?.height || defaultConfig.rowHeight}
              headerHeight={config.header?.height || defaultConfig.headerHeight}
              maxHeight={config.style?.maxHeight}
              border={config.row?.border}
              onSortChange={onSortChange}
            />
          </BeastGridProvider>
        </MenuStoreProvider>
      </DndStoreProvider>
    );
  };

  return (
    <div className={cn('beast-grid', 'default', theme, { border: config?.style?.border, headerBorder: config?.header?.border ?? true })} ref={ref}>
      {renderGrid()}
    </div>
  );
}
