import { MutableRefObject, useEffect, useRef, useState } from 'react';

import DndLayer from './components/dnd/dnd-layer';
import Header from './components/header/header';
import TBody from './components/body/tbody';
import Summary from './components/summary/summary';

import { BeastGridApi, BeastGridConfig, TableStyles } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';

import { BeastGridProvider, BeastApi } from './stores/beast-store';
import { TGridStore, createGridStore } from './stores/grid-store/store';
import { getColumnsFromDefs, initialize } from './stores/grid-store/utils';

import { DndStoreProvider } from './stores/dnd-store';
import { TDndStore, createDndStore } from './stores/dnd-store/store';

import cn from 'classnames';

import './core.scss';
import LoaderLayer, { Loader } from './components/loader/loader';

export const defaultConfig = {
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
};

export function BeastGrid<TData>({ config: userConfig, api }: { config: BeastGridConfig<TData>, store?: MutableRefObject<BeastGridApi> }) {
  const ref = useRef<HTMLDivElement>(null);
  const config: BeastGridConfig<TData> & TableStyles = {
    ...defaultConfig,
    ...userConfig,
  };
  const [[beastGridStore, beastDndStore], setStores] = useState<[TGridStore | null, TDndStore | null]>([null, null]);

  useEffect(() => {
    if (ref.current && config.columnDefs) {
      const columns = getColumnsFromDefs(config.columnDefs, config.defaultColumnDef);

      initialize(columns, ref.current);

      const gridStore = () => createGridStore({ columns, container: ref.current as HTMLDivElement, sort: [] });
      const dndStore = () => createDndStore();

      setStores([gridStore, dndStore]);
    }
  }, [ref, config.columnDefs, config.defaultColumnDef]);


  const renderGrid = () => {
    if (!beastGridStore || !beastDndStore) {
      return <Loader />;
    }

    return (
      <DndStoreProvider createStore={beastDndStore}>
        <BeastGridProvider createStore={beastGridStore}>
          <BeastApi store={api} />
          <DndLayer />
          <LoaderLayer />
          <Header height={config.headerHeight} multiSort={config.mulitSort} />
          <TBody
            height={config.rowHeight}
            headerHeight={config.headerHeight}
            data={config.data}
            border={config.border}
            summary={!!config.summarize}
          />
          <Summary
            data={config.data}
            height={config.rowHeight}
            summary={!!config.summarize}
            border={config.border}
          />
        </BeastGridProvider>
      </DndStoreProvider>
    );
  };

  return (
    <div className={cn('beast-grid', 'default', config.theme)} ref={ref}>
      {renderGrid()}
    </div>
  );
}
