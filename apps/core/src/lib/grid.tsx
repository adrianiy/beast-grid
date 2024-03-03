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
  theme: string;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Grid<T>({ config, defaultConfig, theme, onSortChange }: Props<T>) {
  const [setScrollElement, setTheme] = useBeastStore((state) => [state.setScrollElement, state.setTheme]);
  const ref = useRef<SimpleBarCore>(null);

  useEffect(() => {
    if (ref.current) {
      setScrollElement(ref.current.getScrollElement() as HTMLDivElement);
    }
  }, [ref, setScrollElement])

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme])
  
  return <SimpleBar
    style={{ maxHeight: config.style?.maxHeight }}
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
      maxHeight={config.style?.maxHeight}
      border={config.row?.border}
      onSortChange={onSortChange}
      events={config.row?.events}
    />
  </SimpleBar>;
}
