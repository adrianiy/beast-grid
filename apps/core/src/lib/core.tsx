import { MutableRefObject, useEffect, useRef, useState } from 'react';

import DndLayer from './components/dnd/dnd-layer';
import Header from './components/header/header';
import TBody from './components/body/tbody';
import Summary from './components/summary/summary';

import {
  BeastGridApi,
  BeastGridConfig,
  Column,
  TableStyles,
} from './common/interfaces';
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

export function BeastGrid<TData>({
  config: userConfig,
  theme = 'default',
  api,
  onSortChange,
}: {
  config?: BeastGridConfig<TData>;
  theme?: string;
  api?: MutableRefObject<BeastGridApi | undefined>;
  onSortChange?: (data: TData[], sortColumns: Column[]) => Promise<TData[]>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<
    (BeastGridConfig<TData> & TableStyles) | undefined
  >();
  const [[beastGridStore, beastDndStore], setStores] = useState<
    [TGridStore | null, TDndStore | null]
  >([null, null]);

  useEffect(() => {
    if (userConfig) {
      const config: BeastGridConfig<TData> & TableStyles = {
        ...defaultConfig,
        ...userConfig,
      };

      setConfig(config);
    }
  }, [userConfig]);

  useEffect(() => {
    if (ref.current && config?.columnDefs) {
      const columns = getColumnsFromDefs(
        config.columnDefs,
        config.defaultColumnDef
      );

      initialize(columns, ref.current);

      const gridStore = () =>
        createGridStore({
          columns,
          container: ref.current as HTMLDivElement,
          sort: [],
        });
      const dndStore = () => createDndStore();

      setStores([gridStore, dndStore]);
    }
  }, [ref, config?.columnDefs, config?.defaultColumnDef]);

  const renderGrid = () => {
    if (!config || !beastGridStore || !beastDndStore) {
      return <Loader />;
    }

    return (
      <DndStoreProvider createStore={beastDndStore}>
        <BeastGridProvider createStore={beastGridStore}>
          <BeastApi store={api} />
          <DndLayer />
          <LoaderLayer />
          <Header height={config.headerHeight} multiSort={config.mulitSort} dragOptions={config.dragOptions} />
          <TBody
            height={config.rowHeight}
            headerHeight={config.headerHeight}
            data={config.data}
            border={config.border}
            summary={!!config.summarize}
            onSortChange={onSortChange}
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
    <div className={cn('beast-grid', 'default', theme)} ref={ref}>
      {renderGrid()}
    </div>
  );
}
