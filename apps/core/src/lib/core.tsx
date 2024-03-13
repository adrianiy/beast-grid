import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { IntlProvider } from 'react-intl';

import { BeastGridApi, BeastGridConfig, Column, Data } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';
import { ToolbarPosition } from './common';

import { BeastGridProvider, BeastApi } from './stores/beast-store';

import { DndStoreProvider } from './stores/dnd-store';

import { TGridStore, createGridStore } from './stores/grid-store/store';
import { TDndStore, createDndStore } from './stores/dnd-store/store';

import LoaderLayer, { Loader } from './components/loader/loader';
import Toolbar from './components/toolbar/toolbar';
import Grid from './grid';

import messages from './utils/intl';

import cn from 'classnames';

import './core.scss';
import 'animate.css';

export const defaultConfig = {
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
};

export function BeastGrid<T>({
  config,
  theme = 'default',
  locale = 'en',
  injectStyles = false,
  api,
  onSortChange,
}: {
  config?: BeastGridConfig<T>;
  theme?: string;
  locale?: string;
  api?: MutableRefObject<BeastGridApi | undefined>;
  injectStyles?: boolean;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [[beastGridStore, beastDndStore], setStores] = useState<[TGridStore | null, TDndStore | null]>([null, null]);

  useEffect(() => {
    const cancel = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('dragover', cancel, true);
    document.addEventListener('dragenter', cancel, true);

    return () => {
      document.removeEventListener('dragover', cancel, true);
      document.removeEventListener('dragenter', cancel, true);
    };
  }, [])

  useEffect(() => {
    if (!injectStyles) return;
    
    // inject style.css in head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://cdn.jsdelivr.net/npm/beast-grid/style.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    }
  }, [injectStyles]);

  useEffect(() => {
    if (ref.current && config?.columnDefs) {
      const gridStore: TGridStore = () => createGridStore(config, ref.current as HTMLDivElement, theme);
      const dndStore = () => createDndStore();

      setStores([gridStore, dndStore]);
    }
  }, [ref, config, theme]);

  const GridProvider = () => {
    if (!config || !beastGridStore || !beastDndStore) {
      return (
        <div style={{ height: config?.style?.maxHeight || 300 }}>
          <Loader />
        </div>
      );
    }

    return (
      <DndStoreProvider createStore={beastDndStore}>
        <BeastGridProvider createStore={beastGridStore}>
          <IntlProvider messages={messages[locale]} locale={locale}>
            <BeastApi store={api} />
            <LoaderLayer config={config} />
            <Toolbar config={config} position={ToolbarPosition.TOP} />
            <Grid config={config} defaultConfig={defaultConfig} theme={theme} onSortChange={onSortChange} />
            <Toolbar config={config} position={ToolbarPosition.BOTTOM} />
          </IntlProvider>
        </BeastGridProvider>
      </DndStoreProvider>
    );
  };

  return (
    <div className={cn('beast-grid', 'default', theme)} ref={ref}>
      <GridProvider />
    </div>
  );
}
