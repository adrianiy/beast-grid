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

export function RowCell({ idx, height, row, columnDef, leftPadding }: { height: number; row: Row; columnDef: Column, idx: number, leftPadding: number }) {
  if (columnDef.hidden) {
    return null;
  }

  const Chevron = () => {
    if (idx || (!row.children && !row._children)) {
      return null
    }
    
    return <ChevronRight className={cn(!!row._expanded && 'active')}/>
  }
  
  return (
    <div
      data-hidden={columnDef.hidden}
      className="grid-row-cell"
      style={{ height, left: columnDef.left + leftPadding, width: columnDef.width }}
    >
      <Chevron />
      {getProperty(row, columnDef)}
    </div>
  );
}
