import { MutableRefObject, useEffect, useRef, useState } from 'react';

import DndLayer from './components/dnd/dnd-layer';
import Header from './components/header/header';
import TBody from './components/body/tbody';
import Summary from './components/summary/summary';

import { BeastGridApi, BeastGridConfig, Column, Data, TableStyles } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';

import { BeastGridProvider, BeastApi } from './stores/beast-store';
import { getColumnsFromDefs, initialize } from './stores/grid-store/utils';

import { DndStoreProvider } from './stores/dnd-store';
import { MenuStoreProvider } from './stores/menu-store';

import { TGridStore, createGridStore } from './stores/grid-store/store';
import { TMenuStore, createMenuStore } from './stores/menu-store/store';
import { TDndStore, createDndStore } from './stores/dnd-store/store';


import LoaderLayer, { Loader } from './components/loader/loader';
import MenuLayer from './components/menu/menu-layer';

import cn from 'classnames';

import './core.scss';

export const defaultConfig = {
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
};

export function BeastGrid<T>({
  config: userConfig,
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
  const [config, setConfig] = useState<(BeastGridConfig<T> & TableStyles) | undefined>();
  const [[beastGridStore, beastDndStore, menuStore], setStores] = useState<
    [TGridStore | null, TDndStore | null, TMenuStore | null]
  >([null, null, null]);

  useEffect(() => {
    if (userConfig) {
      const config: BeastGridConfig<T> & TableStyles = {
        ...defaultConfig,
        ...userConfig,
      };

      setConfig(config);
    }
  }, [userConfig]);

  useEffect(() => {
    if (ref.current && config?.columnDefs) {
      const columns = getColumnsFromDefs(config.columnDefs, config.defaultColumnDef);

      initialize(columns, ref.current, config.data as Data);

      const gridStore: TGridStore = () =>
        createGridStore({
          data: config.data as Data,
          columns,
          allowMultipleColumnSort: !!config.mulitSort,
          container: ref.current as HTMLDivElement,
          sort: [],
        });
      const dndStore = () => createDndStore();
      const menuStore = () => createMenuStore();

      setStores([gridStore, dndStore, menuStore]);
    }
  }, [ref, config?.columnDefs, config?.defaultColumnDef]);

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
              height={config.headerHeight}
              multiSort={config.mulitSort}
              dragOptions={config.dragOptions}
            />
            <TBody
              height={config.rowHeight}
              headerHeight={config.headerHeight}
              border={config.border}
              summary={!!config.summarize}
              onSortChange={onSortChange}
            />
            <Summary height={config.rowHeight} summary={!!config.summarize} border={config.border} />
          </BeastGridProvider>
        </MenuStoreProvider>
      </DndStoreProvider>
    );
  };

  return (
    <div className={cn('beast-grid', 'default', theme)} ref={ref}>
      {renderGrid()}
    </div>
  );
}
