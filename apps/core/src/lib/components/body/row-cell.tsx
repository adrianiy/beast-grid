import { Column, ColumnId, ColumnStore, Row, RowConfig } from './../../common/interfaces';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import cn from 'classnames';
import { LEVEL_PADDING } from '../../common';

function getProperty<Type, Key extends keyof Type>(obj: Type, level: number, columnDef: Column, columns: ColumnStore, groupOrder: ColumnId[]): string {
  let field = columnDef.field;

  if (columnDef.tree) {
    field = columns[groupOrder[level]]?.field || field;
  }
  const value = obj[field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

type Props = {
  height: number; row: Row; columnDef: Column, config?: Partial<RowConfig>, level: number; groupOrder: ColumnId[]; columns: ColumnStore
}
export function RowCell({ height, row, columnDef, config, level, groupOrder, columns }: Props) {
  if (columnDef.hidden) {
    return null;
  }

  const Chevron = () => {
    if (!row.children || !columnDef.rowGroup || (groupOrder[level] !== columnDef.id && !columnDef.tree)) {
      return null
    }

    if (level === groupOrder.length && row.children?.length === 1) {
      return null;
    }

    return <ChevronRightIcon className={cn(!!row._expanded && 'active')} />
  }

  return (
    <div
      data-hidden={columnDef.hidden}
      className={cn("grid-row-cell", { lastPinned: columnDef.lastPinned, expandable: row.children || columnDef.rowGroup })}
      style={{ height, left: columnDef.left, paddingLeft: LEVEL_PADDING + (columnDef.tree ? LEVEL_PADDING * level : 0) + (columnDef.tree && !row.children ? LEVEL_PADDING : 0), width: columnDef.width }}
    >
      <Chevron />
      <div className="grid-row-value" style={{ display: (config?.groups?.showChildName || !columnDef.rowGroup || row.children?.length || columnDef.tree) ? 'flex' : 'none' }}>
        {getProperty(row, level, columnDef, columns, groupOrder)}
      </div>
    </div>
  );
}
