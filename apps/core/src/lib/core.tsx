import { useEffect, useRef, useState } from 'react';

import DndLayer from './components/dnd/dnd-layer';
import Header from './components/header/header';
import TBody from './components/body/tbody';
import Summary from './components/summary/summary';

import { BeastGridConfig, TableStyles } from './common/interfaces';
import { HEADER_HEIGHT, ROW_HEIGHT } from './common/globals';

import { BeastGridProvider } from './stores/beast-store';
import { createGridStore } from './stores/grid-store/store';
import { getColumnArrayFromDefs, getColumnsFromDefs, initialize } from './stores/grid-store/utils';

import cn from 'classnames';

import './core.scss';

export const defaultConfig = {
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
};

export function BeastGrid<TData>({ config: userConfig }: { config: BeastGridConfig<TData> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const config: BeastGridConfig<TData> & TableStyles = {
    ...defaultConfig,
    ...userConfig,
  };
  const columnDefs = getColumnsFromDefs(config.columnDefs, config.defaultColumnDef);
  const columns = getColumnArrayFromDefs(columnDefs);

  useEffect(() => {
    if (ref.current) {
      setReady(true);
    }
  }, [ref, columnDefs, config.theme]);

  const renderGrid = () => {
    if (!ready || !ref.current) {
      return;
    }

    initialize(columnDefs, columns, ref.current);

    const store = createGridStore({ columnDefs, container: ref.current, columns });

    return (
      <BeastGridProvider createStore={() => store}>
        <DndLayer />
        <Header height={config.headerHeight} multiSort={config.mulitSort} />
        <TBody
          height={config.rowHeight}
          headerHeight={config.headerHeight}
          data={config.data}
          border={config.border}
          summary={!!config.summarize}
        />
        <Summary data={config.data} height={config.rowHeight} summary={!!config.summarize} border={config.border} />
      </BeastGridProvider>
    );
  };

  return (
    <div className={cn("beast-grid", "default", config.theme)} ref={ref}>
      {renderGrid()}
    </div>
  );
}

