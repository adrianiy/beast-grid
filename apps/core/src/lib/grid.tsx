import { BeastGridConfig, Column, Data } from './common';
import SimpleBar from 'simplebar-react';
import TBody from './components/body/tbody';
import Header from './components/header/header';

import cn from 'classnames';

import 'simplebar-react/dist/simplebar.min.css';

type Props<T> = {
  config: BeastGridConfig<T>;
  defaultConfig: Partial<BeastGridConfig<T>>;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Grid<T>({ config, defaultConfig, onSortChange }: Props<T>) {
  return <SimpleBar
    style={{ height: config.style?.maxHeight }}
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
    />
  </SimpleBar>;
}
