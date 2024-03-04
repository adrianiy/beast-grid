import { useEffect, useRef, useState } from 'react';

import { useBeastStore } from './../../stores/beast-store';

import RowContainer from './row';

import { BusActions, Column, Data, Row, RowEvents, SortType } from '../../common';

import './tbody.scss';
import useBus from 'use-bus';

type TBodyProps = {
    rowHeight: number;
    headerHeight: number;
    maxHeight?: number;
    border?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
    filters?: Record<string, string[]>;
    events?: Partial<RowEvents>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 5;

export default function TBody({ rowHeight, headerHeight, maxHeight, border, onSortChange, events }: TBodyProps) {
    const gaps = useRef<Record<number, number>>({});
    const [data, columns, container, scrollElement, sort, filters, setSorting] = useBeastStore((state) => [
        state.data,
        state.columns,
        state.container,
        state.scrollElement,
        state.sort,
        state.filters,
        state.setSorting,
    ]);
    const [expandedRows, setExpandedRows] = useState<number>(0);
    const [lastScroll, setLastScroll] = useState<number>(0);
    const [[max, min], setMaxMin] = useState([0, 0]);
    const [sortedData, setSortedData] = useState<Data>([]);

    const levels = Object.values(columns).reduce((acc, column) => {
        const level = column.level || 0;
        acc[level] = acc[level] || [];
        acc[level].push(column);
        return acc;
    }, [] as Column[][]);

    useEffect(() => {
        if (scrollElement && container) {
            scrollElement.addEventListener('scroll', () => {
                if (scrollElement.scrollTop !== lastScroll) {
                    setLastScroll(scrollElement.scrollTop);
                }
            });
        }
    }, [scrollElement, container, headerHeight, rowHeight, levels.length, data.length]);

    useEffect(() => {
        const containerHeight = (maxHeight ? maxHeight : container.getBoundingClientRect().height) - headerHeight * levels.length;
        const visibleRows = Math.floor(containerHeight / rowHeight);
        const topRow = Math.floor(lastScroll / rowHeight);
        const bottomRow = topRow + visibleRows;
        const maxValue = Math.min(data.length + expandedRows, bottomRow + THRESHOLD);
        const minValue = Math.max(0, topRow - THRESHOLD - expandedRows);

        setMaxMin([maxValue, minValue]);
    }, [lastScroll, expandedRows, data.length]);

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

    useBus(
        BusActions.EXPAND,
        () => sortedData.forEach((row, idx) => forceRowExpand(row, idx, true)),
        [sortedData]
    )

    useBus(
        BusActions.COLLAPSE,
        () => sortedData.forEach((row, idx) => forceRowExpand(row, idx, false)),
        [sortedData]
    )

    const lastLevel = Object.values(columns).filter((c) => c.final);

    const updateGaps = (gap: number, idx: number) => {
        for (let i = idx + 1; i < data.length; i++) {
            gaps.current[i] = (gaps.current[i] || 0) + gap;
        }
    };

    const forceRowExpand = (row: Row, idx: number, value: boolean) => {
        if (row._expanded !== value) {
            if (value) {
                expandRow(row, idx);
            } else {
                collapseRow(row, idx);
            }
        }
    }

    const expandRow = (row: Row, idx: number) => {
        row._expanded = true;
        updateGaps(rowHeight * (row.children?.length || 0), idx);
        setExpandedRows((state) => state + (row.children?.length || 0));
    }

    const collapseRow = (row: Row, idx: number) => {
        row._expanded = false;
        setExpandedRows((state) => state - (row.children?.length || 0));
        updateGaps(rowHeight * (row.children?.length || 0) * -1, idx);
    }

    const handleRowExpand = (row: Row, idx: number) => {
        if (row._expanded) {
            collapseRow(row, idx);
        } else {
            expandRow(row, idx);
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
                        level={1}
                        onClick={handleRowExpand}
                        events={events}
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
                                    level={2}
                                    events={events}
                                />
                            );
                        }
                    }
                }
            }
        }

        return renderArray.concat(...childrenArray);
    };

    const getStyleProps = () => {
        return {
            height: sortedData.length * rowHeight,
        };
    };

    const dataSlice = createDataSlice();

    return (
        <div className="grid-body" style={getStyleProps()}>
            {dataSlice}
        </div>
    );
}
