import { useEffect, useState } from 'react';

import { RowCell } from './row-cell';

import { useBeastStore } from './../../stores/beast-store';

import { Column, SortType } from '../../common';

import * as Timsort from 'timsort';

import './tbody.scss';

type TBodyProps<TData> = {
  height: number;
  headerHeight: number;
  border?: boolean;
  summary?: boolean;
  data: TData[];
};

let lastIdx = 0;

export default function TBody<TData>({ height, headerHeight, border, data, summary }: TBodyProps<TData>) {
  const [columns, container, sort] = useBeastStore((state) => [state.columns, state.container, state.sort]);
  const [[max, min], setMaxMin] = useState([500, 0]);
  const [sortedData, setSortedData] = useState<TData[]>([]);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  useEffect(() => {
    if (container) {
      container.addEventListener('scroll', () => {
        const threshold = height * 3;
        const containerHeight = container.getBoundingClientRect().height - headerHeight * levels.length;
        const maxValue = containerHeight + threshold;
        const minValue = -threshold;

        setMaxMin([maxValue, minValue]);
      });
    }
  }, [container, headerHeight, height, levels.length]);

  useEffect(() => {
    setSortedData(data);
  }, [data]);

  useEffect(() => {
    if (sortedData.length > 0) {
      const sortData = (a: TData, b: TData) => {
        const sortColumns = Object.values(columns)
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

      Timsort.sort(sortedData, sortData);

      setSortedData(sortedData);
    }
  }, [sort, sortedData]);

  const lastLevel = levels[levels.length - 1];

  const getClass = () => {
    return `grid-row ${border ? 'bordered' : ''}`;
  };

  const createDataSlice = () => {
    const renderArray = [];
    for (let idx = lastIdx; idx < sortedData.length; idx++) {
      const position = height * idx - (container?.scrollTop || 0);

      if (position > max || position < min) {
        lastIdx = Math.floor(container?.scrollTop / height);
        break;
      }

      const row = sortedData[idx];

      renderArray.push(
        <div key={idx} className={getClass()} style={{ top: height * idx, height }}>
          {lastLevel?.map((column, idx) => (
            <RowCell key={idx} height={height} row={row} columnDef={column} />
          ))}
        </div>
      );
    }

    return renderArray;
  };

  return (
    <div className="grid-body">
      {sortedData.length > 0 && createDataSlice()}
      {summary && (
        <div className="grid-row-cell" style={{ height, top: height * data.length }}>
          ghost summary
        </div>
      )}
    </div>
  );
}
