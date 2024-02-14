import { useEffect, useState } from 'react';

import { RowCell } from './row-cell';

import { useBeastStore } from './../../stores/beast-store';

import { BeastGridConfig, Column, SortType } from '../../common';

import './tbody.scss';

type TBodyProps<TData> = {
  height: number;
  headerHeight: number;
  border?: boolean;
  summary?: boolean;
  data: TData[];
  onSortChange?: (data: TData[], sortColumns: Column[]) => Promise<TData[]>;
};

let lastIdx = 0;

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = (height: number) => height * 3;

export default function TBody<TData>({
  height,
  headerHeight,
  border,
  data,
  summary,
  onSortChange,
}: TBodyProps<TData>) {
  const [columns, container, sort, setSorting] = useBeastStore((state) => [
    state.columns,
    state.container,
    state.sort,
    state.setSorting,
  ]);
  const [[max, min], setMaxMin] = useState([500, 0]);
  const [sortedData, setSortedData] = useState<TData[]>([]);
  const threshold = THRESHOLD(height);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  useEffect(() => {
    if (container) {
      container.addEventListener('scroll', () => {
        const containerHeight =
          container.getBoundingClientRect().height -
          headerHeight * levels.length;
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
      const sortColumns = Object.values(columns)
        .filter((c) => c.sort)
        .sort((a, b) => (a.sort?.priority || 0) - (b.sort?.priority || 0));

      if (sortColumns.length === 0) {
        return;
      }

      const sortData = (a: TData, b: TData) => {
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

      const asyncSort = async () => {
        if (onSortChange) {
          const result = await onSortChange(sortedData, sortColumns);

          if (result) {
            setSortedData(result);
          }
        } else {
          if (sortedData.length > PERFORMANCE_LIMIT) {
            setSorting(true);
          }
          setTimeout(() => {
            sortedData.sort(sortData);

            setSortedData(sortedData);
            if (data.length > PERFORMANCE_LIMIT) {
              setTimeout(() => setSorting(false), 100);
            }
          }, 0);
        }
      };

      asyncSort();
    }
  }, [sort]);

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
        <div
          key={idx}
          className={getClass()}
          style={{ top: height * idx, height }}
        >
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
        <div
          className="grid-row-cell"
          style={{ height, top: height * data.length }}
        >
          ghost summary
        </div>
      )}
    </div>
  );
}
