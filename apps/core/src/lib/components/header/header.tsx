import HeaderCell from './cell';

import { useBeastStore } from './../../stores/beast-store';

import { SortType } from './../../common/enums';
import { Column } from '../../common/interfaces';


import './header.scss';

export default function Header({ height, multiSort }: { height: number, multiSort?: boolean }) {
  const [columns, columnDefs, setColumnDefs] = useBeastStore((state) => [
    state.columns,
    state.columnDefs,
    state.setColumnDefs,
  ]);

  const changeSort = (column: Column) => () => {
    if (!multiSort) {
      for (const col of Object.values(columnDefs)) {
        if (col.id !== column.id && col.sort) {
          delete col.sort;
        }
      }
    }
    const lastPriority = multiSort ? Math.max(...Object.values(columnDefs).map(c => c.sort?.priority || 0)) : -1;
    
    if (!column.sort) {
      column.sort = { order: SortType.ASC, priority: lastPriority + 1};
    } else if (column.sort.order === SortType.ASC) {
      column.sort.order = SortType.DESC;
    } else {
      delete column.sort;
    }
    setColumnDefs(columnDefs);
  };

  return (
    <div className="grid-header row between" style={{ height: height * columns.length }}>
      {columns.map((level, levelIdx) => (
        <div className="grid-header-row row" style={{ height }} key={levelIdx}>
          {level.map((column, idx) => (
            <HeaderCell
              key={idx}
              levelIdx={levelIdx}
              idx={idx}
              height={height}
              column={columnDefs[column.id]}
              columnDefs={columnDefs}
              changeSort={changeSort}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
