import { useEffect, useState } from 'react';

import { RowCell } from './row-cell';

import { useBeastStore } from './../../stores/beast-store';
import { SortType } from './../../common/enums';

import './tbody.scss';

type TBodyProps<TData> = {
  height: number;
  headerHeight: number;
  data: TData[];
  border?: boolean;
  summary?: boolean;
};

export default function TBody<TData>({ height, headerHeight, data, border, summary }: TBodyProps<TData>) {
  const [columnDefs, columns, container] = useBeastStore((state) => [
    state.columnDefs,
    state.columns,
    state.container,
  ]);
  const [[max, min], setMaxMin] = useState([500, 0]);

  useEffect(() => {
    if (container) {
      container.addEventListener('scroll', () => {
        const threshold = height * 3;
        const containerHeight = container.getBoundingClientRect().height - headerHeight * columns.length;
        const maxValue = containerHeight + threshold;
        const minValue = -threshold;

        setMaxMin([maxValue, minValue]);
      });
    }
  }, [container, columns.length, headerHeight, height]);

  const lastLevel = columns[columns.length - 1];

  const getClass = () => {
    return `grid-row ${border ? 'bordered' : ''}`;
  };

  const sortData = (a: TData, b: TData) => {
    const sortColumns = Object.values(columnDefs)
      .filter((c) => c.sort)
      .sort((a, b) => (a.sort?.priority || 0) - (b.sort?.priority || 0));

    for (const column of sortColumns) {
      const valueA = a[column.field as keyof TData];
      const valueB = b[column.field as keyof TData];

      if (valueA > valueB) {
        return column.sort?.order === SortType.ASC ? 1 : -1;
      }
      if (valueA < valueB) {
        return column.sort?.order === SortType.ASC ? -1 : 1;
      }
    }
    return 0;
  };

  const Row = (row: TData, idx: number) => {
    const position = height * idx - (container?.scrollTop || 0);

    if (position > max || position < min) {
      return null;
    }

    return (
      <div key={idx} className={getClass()} style={{ top: height * idx, height }}>
        {lastLevel?.map((column, idx) => (
          <RowCell key={idx} height={height} row={row} columnDef={columnDefs[column.id]} />
        ))}
      </div>
    );
  };

  return (
    <div className="grid-body">
      {data.sort(sortData).map((row, idx) => Row(row, idx))}
      {summary && (
        <div className="grid-row-cell" style={{ height, top: height * data.length }}>
          ghost summary
        </div>
      )}
    </div>
  );
}
