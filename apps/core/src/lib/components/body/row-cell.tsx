import { ChevronRight } from '@mui/icons-material';
import { Column, ColumnId, Row, RowConfig } from './../../common/interfaces';

import cn from 'classnames';

function getProperty<Type, Key extends keyof Type>(obj: Type, columnDef: Column): string {
  const value = obj[columnDef.field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

type Props = {
  height: number; row: Row; columnDef: Column, paddingLeft: number, config?: Partial<RowConfig>, level: number; groupOrder: ColumnId[];
}
export function RowCell({ height, row, columnDef, paddingLeft, config, level, groupOrder }: Props) {
  if (columnDef.hidden) {
    return null;
  }

  const Chevron = () => {
    if (!row.children || !columnDef.rowGroup || groupOrder[level - 1] !== columnDef.id) {
      return null
    }

    return <ChevronRight className={cn(!!row._expanded && 'active')} />
  }

  return (
    <div
      data-hidden={columnDef.hidden}
      className={cn("grid-row-cell", { lastPinned: columnDef.lastPinned, expandable: row.children || columnDef.rowGroup })}
      style={{ height, left: columnDef.left, paddingLeft: paddingLeft, width: columnDef.width }}
    >
      <Chevron />
      <div className="grid-row-value" style={{ display: (config?.groups?.showChildName || !columnDef.rowGroup || row.children?.length) ? 'flex' : 'none' }}>
        {getProperty(row, columnDef)}
      </div>
    </div>
  );
}
