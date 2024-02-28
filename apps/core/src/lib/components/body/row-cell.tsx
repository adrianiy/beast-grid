import { ChevronRight } from '@mui/icons-material';
import { Column, Row } from './../../common/interfaces';

import cn from 'classnames';

function getProperty<Type, Key extends keyof Type>(obj: Type, columnDef: Column): string {
  const value = obj[columnDef.field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

export function RowCell({ height, row, columnDef, leftPadding }: { height: number; row: Row; columnDef: Column, leftPadding: number }) {
  if (columnDef.hidden) {
    return null;
  }

  const Chevron = () => {
    if (!columnDef.aggregationLevel || !row.children) {
      return null
    }

    return <ChevronRight className={cn(!!row._expanded && 'active')} />
  }

  return (
    <div
      data-hidden={columnDef.hidden}
      className="grid-row-cell"
      style={{ height, left: columnDef.left + leftPadding, width: columnDef.width }}
    >
      <Chevron />
      <div className="grid-row-value">
        { getProperty(row, columnDef) }
      </div>
    </div>
  );
}
