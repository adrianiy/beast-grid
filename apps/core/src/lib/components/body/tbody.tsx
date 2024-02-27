import { useEffect, useRef, useState } from 'react';

import { useBeastStore } from './../../stores/beast-store';

import { Column, Data, Row, SortType } from '../../common';

import './tbody.scss';
import RowContainer from './row';

type TBodyProps = {
    rowHeight: number;
    headerHeight: number;
    maxHeight?: number;
    border?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 4;

export default function TBody({ rowHeight, headerHeight, maxHeight, border, onSortChange }: TBodyProps) {
    const gaps = useRef<Record<number, number>>({});
    const lastScroll = useRef<number>(0);
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
                const containerHeight = maxHeight || container.getBoundingClientRect().height - headerHeight * levels.length;
                const visibleRows = Math.ceil(containerHeight / rowHeight);
                const topRow = Math.floor(container.scrollTop / rowHeight);
                const bottomRow = topRow + visibleRows;
                const maxValue = Math.min(data.length, bottomRow + THRESHOLD);
                const minValue = Math.max(0, topRow - THRESHOLD - expandedRows.current);

                setMaxMin([maxValue, minValue]);
            };
            container.addEventListener('scroll', () => {
                if (container.scrollTop !== lastScroll.current) {
                    setMaxMinValues();
                }
                lastScroll.current = container.scrollTop;
            });
            setMaxMinValues();
        }
    }, [container, headerHeight, rowHeight, levels.length, data.length]);

    useEffect(() => {
        const someActive = Object.entries(filters).some(
            ([key, value]) => value.length && value.length !== columns[key].filterOptions?.length
        );
        setSortedData(
            someActive
                ? data.filter((d) => {
                      let show = true;

                      for (const filterKey of Object.keys(filters)) {
                          if (filters[filterKey].includes(`${d[columns[filterKey].field as string]}`)) {
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
                            updateGaps(rowHeight * (row.children?.length || 0), idx);
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
                                updateGaps(rowHeight * (row.children?.length || 0), idx);
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

    const lastLevel = Object.values(columns).filter(c => c.final);
    
    const updateGaps = (gap: number, idx: number) => {
        for (let i = idx + 1; i < data.length; i++) {
            gaps.current[i] = (gaps.current[i] || 0) + gap;
        }
    };

    const handleRowExpand = (row: Row, idx: number) => () => {
        if (row._expanded) {
            row._expanded = false;
            expandedRows.current -= row.children?.length || 0;
            updateGaps(rowHeight * (row.children?.length || 0) * -1, idx);
            setMaxMin([max, min]);
        } else {
            row._expanded = true;
            updateGaps(rowHeight * (row.children?.length || 0), idx);
            expandedRows.current += row.children?.length || 0;
            setMaxMin([max + (row.children?.length || 0), min]);
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
                        height={rowHeight}
                        level={0}
                        onClick={handleRowExpand}
                        gap={gaps.current[idx] || 0}
                    />
                );
                if (row._expanded) {
                    for (let i = 0; i < (row.children?.length || 0); i++) {
                        const child = row.children?.[i];
                        if (child) {
                            childrenArray.push(
                                <RowContainer
                                    key={`children-${idx}-${i}`}
                                    row={child}
                                    columns={lastLevel}
                                    idx={idx + i + 1}
                                    border={border}
                                    height={rowHeight}
                                    gap={gaps.current[idx] || 0}
                                    level={1}
                                />
                            );
                        }
                    }
                }
            }
        }

        return renderArray.concat(...childrenArray);
    };

    const getStyleProps = (dataSlice: JSX.Element[]) => {
        return {
            height: Math.min(dataSlice.length * rowHeight, maxHeight || Infinity),
        }
    }

    const dataSlice = createDataSlice();
    
    return <div className="grid-body" style={getStyleProps(dataSlice)}>{dataSlice}</div>;
}
