import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { BeastGridApi, BeastGridConfig, Column, Data } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';

import { BeastGridProvider, BeastApi } from './stores/beast-store';

import { DndStoreProvider } from './stores/dnd-store';

import { TGridStore, createGridStore } from './stores/grid-store/store';
import { TDndStore, createDndStore } from './stores/dnd-store/store';

import LoaderLayer, { Loader } from './components/loader/loader';
import DndLayer from './components/dnd/dnd-layer';
import Grid from './grid';

import cn from 'classnames';

import './core.scss';
import 'animate.css';
import SideBar from './components/sidebar/sidebar';

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
  const [[beastGridStore, beastDndStore], setStores] = useState<[TGridStore | null, TDndStore | null]>([null, null]);

  useEffect(() => {
    if (ref.current && config?.columnDefs) {
      const gridStore: TGridStore = () => createGridStore(config, ref.current as HTMLDivElement, theme);
      const dndStore = () => createDndStore();

      setStores([gridStore, dndStore]);
    }
  }, [ref, config, theme]);

  const renderGrid = () => {
    if (!config || !beastGridStore || !beastDndStore) {
      return <div style={{ height: config?.style?.maxHeight || 300 }}><Loader /></div>
    }

    return (
      <DndStoreProvider createStore={beastDndStore}>
        <BeastGridProvider createStore={beastGridStore}>
          <BeastApi store={api} />
          <DndLayer config={config} />
          <LoaderLayer config={config} />
          <SideBar config={config}/>
          <Grid config={config} defaultConfig={defaultConfig} theme={theme} onSortChange={onSortChange} />
        </BeastGridProvider>
      </DndStoreProvider>
    );
  };

  return (
    <div className={cn('beast-grid', 'default', theme)} ref={ref}>
      {renderGrid()}
    </div>
  );
}
