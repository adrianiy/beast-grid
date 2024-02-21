import { useEffect, useRef, useState } from 'react';

import { RowCell } from './row-cell';

import { useBeastStore } from './../../stores/beast-store';

import { Column, Data, Row, SortType } from '../../common';

import './tbody.scss';
import RowContainer from './row';

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
  const gaps = useRef<Record<number, number>>({});
  const expandedRows = useRef<number>(0);
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
        const minValue = Math.max(0, topRow - THRESHOLD - expandedRows.current);

        setMaxMin([maxValue, minValue]);
      };
      container.addEventListener('scroll', () => {
        setMaxMinValues();
      });
      setMaxMinValues();
    }
  }, [container, headerHeight, height, levels.length, data.length]);

  useEffect(() => {
    const someActive = Object.entries(filters).some(
      ([key, value]) => value.length && value.length !== columns[key].filterOptions?.length
    );
    setSortedData(
      someActive
        ? data.filter((d) => {
          let show = true;

          for (const filterKey of Object.keys(filters)) {
            if (filters[filterKey].includes(`${d[columns[filterKey].field]}`)) {
              show = show && true;
            } else {
              show = show && false;
            }
          }
          return show;
        })
        : data
    );
  }, [data, columns, filters]);

  useEffect(() => {
    gaps.current = {};
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

          result.forEach((row, idx) => {
            if (row._expanded) {
              updateGaps(height * row.children.length, idx);
            }
          });

          if (result) {
            setSortedData(result);
          }
        } else {
          if (sortedData.length > PERFORMANCE_LIMIT) {
            setSorting(true);
          }
          setTimeout(() => {
            sortedData.sort(sortData);
            sortedData.forEach((row, idx) => {
              if (row._expanded) {
                updateGaps(height * row.children.length, idx);
              }
            });

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

  const updateGaps = (gap: number, idx: number) => {
    for (let i = idx + 1; i < data.length; i++) {
      gaps.current[i] = (gaps.current[i] || 0) + gap;
    }
  };

  const handleRowExpand = (row: Row, idx: number) => () => {
    if (row._expanded) {
      row._expanded = false;
      expandedRows.current -= row.children.length;
      updateGaps(height * row.children.length * -1, idx);
      setMaxMin([max - row.children.length, min]);
    } else {
      row._expanded = true;
      updateGaps(height * row.children.length, idx);
      expandedRows.current += row.children.length;
      setMaxMin([max + row.children.length, min]);
    }
  };

  const createDataSlice = () => {
    const renderArray = [];
    const childrenArray = [];
    for (let idx = min; idx < max; idx++) {
      const row = sortedData[idx];

      if (row) {
        renderArray.push(
          <RowContainer
            key={idx}
            row={row}
            columns={lastLevel}
            idx={idx}
            border={border}
            height={height}
            onClick={handleRowExpand}
            gap={gaps.current[idx] || 0}
          />
        );
        if (row._expanded) {
          for (let i = 0; i < row.children.length; i++) {
            const child = row.children[i];
            childrenArray.push(
              <RowContainer
                key={`children-${idx}-${i}`}
                row={child}
                columns={lastLevel}
                idx={idx + i + 1}
                border={border}
                height={height}
                gap={gaps.current[idx] || 0}
                level={1}
              />
            );
          }
        }
      }
    }

    return renderArray.concat(...childrenArray);
  };

  return <div className="grid-body">{sortedData.length > 0 && createDataSlice()}</div>;
}
