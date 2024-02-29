import { BeastGridConfig, Column, Data } from './common';
import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';
import TBody from './components/body/tbody';
import Header from './components/header/header';

import cn from 'classnames';

import 'simplebar-react/dist/simplebar.min.css';
import { useEffect, useRef } from 'react';
import { useBeastStore } from './stores/beast-store';

type Props<T> = {
  config: BeastGridConfig<T>;
  defaultConfig: Partial<BeastGridConfig<T>>;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Grid<T>({ config, defaultConfig, onSortChange }: Props<T>) {
  const [setScrollElement] = useBeastStore((state) => [state.setScrollElement]);
  const ref = useRef<SimpleBarCore>(null);

  useEffect(() => {
    if (ref.current) {
      setScrollElement(ref.current.getScrollElement() as HTMLDivElement);
    }
  }, [ref])
  
  return <SimpleBar
    style={{ height: config.style?.maxHeight }}
    ref={ref}
    className={cn('beast-grid__container', {
      border: config?.style?.border,
      headerBorder: config?.header?.border ?? true,
    })}
  >
    <Header
      height={config.header?.height || (defaultConfig.headerHeight as number)}
      border={config.header?.border ?? true}
      multiSort={config.sort?.multiple}
      dragOptions={config.dragOptions}
    />
    <TBody
      rowHeight={config.row?.height || (defaultConfig.rowHeight as number)}
      headerHeight={config.header?.height || (defaultConfig.headerHeight as number)}
      border={config.row?.border}
      onSortChange={onSortChange}
      events={config.row?.events}
    />
  </SimpleBar>;
}
