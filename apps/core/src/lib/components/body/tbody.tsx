import { useEffect, useState } from 'react';

import { RowCell } from './row-cell';

import { useBeastStore } from './../../stores/beast-store';

import { Column, Data, Row, SortType } from '../../common';

import './tbody.scss';

type TBodyProps = {
  height: number;
  headerHeight: number;
  border?: boolean;
  summary?: boolean;
  onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 4;

export default function TBody({ height, headerHeight, border, summary, onSortChange }: TBodyProps) {
  const [data, columns, container, sort, filters, setSorting] = useBeastStore((state) => [
    state.data,
    state.columns,
    state.container,
    state.sort,
    state.filters,
    state.setSorting,
  ]);
  const [[max, min], setMaxMin] = useState([0, 0]);
  const [sortedData, setSortedData] = useState<Data>([]);

  const levels = Object.values(columns).reduce((acc, column) => {
    const level = column.level || 0;
    acc[level] = acc[level] || [];
    acc[level].push(column);
    return acc;
  }, [] as Column[][]);

  useEffect(() => {
    if (container) {
      const setMaxMinValues = () => {
        const containerHeight = container.getBoundingClientRect().height - headerHeight * levels.length;
        const visibleRows = Math.ceil(containerHeight / height);
        const topRow = Math.floor(container.scrollTop / height);
        const bottomRow = topRow + visibleRows;
        const maxValue = Math.min(data.length, bottomRow + THRESHOLD);
        const minValue = Math.max(0, topRow - THRESHOLD);

        setMaxMin([maxValue, minValue]);
      };
      container.addEventListener('scroll', () => {
        setMaxMinValues();
      });
      setMaxMinValues();
    }
  }, [container, headerHeight, height, levels.length, data.length]);

  useEffect(() => {
    const someActive = Object.entries(filters).some(([key, value]) => value.length && value.length !== columns[key].filterOptions?.length);
    setSortedData(someActive ?
      data.filter((d) => {
        let show = true;

        for (const filterKey of Object.keys(filters)) {
          if (filters[filterKey].includes(`${d[columns[filterKey].field]}`)) {
            show = show && true;
          } else {
            show = show && false;
          }
        }
        return show;
      }) : data
    );
  }, [data, columns, filters]);

  useEffect(() => {
    if (sortedData.length > 0) {
      const sortColumns = Object.values(columns)
        .filter((c) => c.sort)
        .sort((a, b) => (a.sort?.priority || 0) - (b.sort?.priority || 0));

      if (sortColumns.length === 0) {
        return;
      }

      const sortData = (a: Row, b: Row) => {
        for (const column of sortColumns) {
          const valueA = a[column.field as keyof Row] as number;
          const valueB = b[column.field as keyof Row] as number;

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
    for (let idx = min; idx < max; idx++) {
      const row = sortedData[idx];

      if (row) {
        renderArray.push(
          <div key={idx} className={getClass()} style={{ top: height * idx, height }}>
            {lastLevel?.map((column, idx) => (
              <RowCell key={idx} height={height} row={row} columnDef={column} />
            ))}
          </div>
        );
      }
    }

    return renderArray;
  };

  return (
    <div className="grid-body">
      {sortedData.length > 0 && createDataSlice()}
      {summary && sortedData.length >= (max - THRESHOLD) && (
        <div className="grid-row-cell" style={{ height, top: height * data.length }}>
          ghost summary
        </div>
      )}
    </div>
  );
}
