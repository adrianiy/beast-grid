import { ChevronRight } from '@mui/icons-material';
import { Column, Row, RowConfig } from './../../common/interfaces';

import cn from 'classnames';

function getProperty<Type, Key extends keyof Type>(obj: Type, columnDef: Column): string {
  const value = obj[columnDef.field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

export function RowCell({ height, row, columnDef, paddingLeft, config, level }: { height: number; row: Row; columnDef: Column, paddingLeft: number, config?: Partial<RowConfig>, level: number }) {
  if (columnDef.hidden) {
    return null;
  }

  const Chevron = () => {
    if (!row.children || columnDef.aggregationLevel !== level) {
      return null
    }

    return <ChevronRight className={cn(!!row._expanded && 'active')} />
  }

  return (
    <div
      data-hidden={columnDef.hidden}
      className={cn("grid-row-cell", { lastPinned: columnDef.lastPinned, expandable: row.children || columnDef.aggregationLevel })}
      style={{ height, left: columnDef.left, paddingLeft: paddingLeft, width: columnDef.width }}
    >
      <Chevron />
      <div className="grid-row-value" style={{ display: (config?.groups?.showChildName || !columnDef.aggregationLevel || row.children?.length) ? 'flex' : 'none' }}>
        { getProperty(row, columnDef) }
      </div>
    </div>
  );
}
