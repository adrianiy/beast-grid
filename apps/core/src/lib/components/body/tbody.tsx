import { ReactNode, useEffect, useRef, useState } from 'react';
import useBus from 'use-bus';

import { useBeastStore } from './../../stores/beast-store';

import RowContainer from './row';

import { BusActions, Column, Coords, Data, Row, RowConfig, RowEvents } from '../../common';

import './tbody.scss';
import { filterRow, sortData } from '../../utils/functions';
import ContextMenu from '../contextMenu/context-menu';

type TBodyProps = {
    rowHeight: number;
    headerHeight: number;
    config?: Partial<RowConfig>;
    maxHeight?: number;
    border?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
    filters?: Record<string, string[]>;
    events?: Partial<RowEvents>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 5;

export default function TBody({
    rowHeight,
    headerHeight,
    config,
    maxHeight,
    border,
    onSortChange,
    events,
}: TBodyProps) {
    const gaps = useRef<Record<string, number>>({});
    const [
        data,
        columns,
        theme,
        container,
        scrollElement,
        sort,
        filters,
        setSorting,
        groupOrder,
        setSelecting,
        selectedCells,
    ] = useBeastStore((state) => [
        state.data,
        state.columns,
        state.theme,
        state.container,
        state.scrollElement,
        state.sort,
        state.filters,
        state.setSorting,
        state.groupOrder,
        state.setSelecting,
        state.selectedCells,
    ]);
    const [expandedRows, setExpandedRows] = useState<number>(0);
    const [lastScroll, setLastScroll] = useState<number>(0);
    const [[max, min], setMaxMin] = useState([0, 0]);
    const [sortedData, setSortedData] = useState<Data>([]);
    const [contextMenu, setContextMenu] = useState<Coords | null>(null);

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
        const containerHeight =
            (maxHeight ? maxHeight : container.getBoundingClientRect().height) - headerHeight * levels.length;
        const visibleRows = Math.floor(containerHeight / rowHeight);
        const topRow = Math.floor(lastScroll / rowHeight);
        const bottomRow = topRow + visibleRows;
        const maxValue = Math.min(data.length + expandedRows, bottomRow + THRESHOLD);
        const minValue = Math.max(0, topRow - THRESHOLD - expandedRows);

        setMaxMin([maxValue, minValue]);
    }, [lastScroll, expandedRows, data.length, filters]);

    useEffect(() => {
        const someActive = Object.entries(filters).some(
            ([key, value]) => value.length && value.length !== columns[key].filterOptions?.length
        );
        const newSortedData = someActive ? (data.map(filterRow(columns, filters)).filter(Boolean) as Row[]) : data;

        setSortedData(newSortedData);
        const [, expanded] = updateGaps(0, newSortedData);
        setExpandedRows(expanded);
    }, [data, columns, filters]);

    useEffect(() => {
        gaps.current = {};
        if (sortedData.length > 0) {
            const sortColumns = Object.values(columns)
                .filter((c) => c.sort)
                .sort((a, b) => (a.sort?.priority || 0) - (b.sort?.priority || 0));

            const asyncSort = async () => {
                if (onSortChange) {
                    const result = await onSortChange(sortedData, sortColumns);

                    updateGaps(0, result);

                    if (result) {
                        setSortedData(result);
                    }
                } else {
                    if (sortedData.length > PERFORMANCE_LIMIT) {
                        setSorting(true);
                    }
                    setTimeout(() => {
                        sortedData.sort(sortData(sortColumns));
                        updateGaps(0, sortedData);

                        setSortedData([...sortedData]);
                        if (data.length > PERFORMANCE_LIMIT) {
                            setTimeout(() => setSorting(false), 100);
                        }
                    }, 0);
                }
            };

            asyncSort();
        }
    }, [sort]);

    useBus(BusActions.EXPAND, () => sortedData.forEach((row) => forceRowExpand(row, true)), [sortedData]);

    useBus(BusActions.COLLAPSE, () => sortedData.forEach((row) => forceRowExpand(row, false)), [sortedData]);

    const lastLevel = Object.values(columns).filter((c) => c.final);

    const forceRowExpand = (row: Row, value: boolean) => {
        if (row._expanded == null && !value) {
            return;
        }
        if (row._expanded !== value) {
            if (value) {
                expandRow(row);
            } else {
                collapseRow(row);
            }

            if (row.children) {
                row.children.forEach((child) => forceRowExpand(child, value));
            }
        }
    };

    const updateGaps = (gap = 0, gapData = sortedData, expanded = 0): [number, number] => {
        for (let idx = 0; idx < gapData.length; idx++) {
            const row = gapData[idx];
            if (row) {
                gaps.current[row._id as string] = gap;
                if (row.children && row._expanded) {
                    expanded += row.children.length;
                    [gap, expanded] = updateGaps(gap, row.children, expanded);
                }
                gap += row._expanded ? (row.children?.length || 0) * rowHeight : 0;
            }
        }

        return [gap, expanded];
    };

    const expandRow = (row: Row) => {
        row._expanded = true;
        const [, expanded] = updateGaps();
        setExpandedRows(expanded);
    };

    const collapseRow = (row: Row) => {
        row._expanded = false;
        const [, expanded] = updateGaps();
        setExpandedRows(expanded);
    };

    const handleRowExpand = (row: Row) => () => {
        if (row._expanded) {
            collapseRow(row);
        } else {
            expandRow(row);
        }
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
        setSelecting(false);
    };

    const getCsv = (withHeaders: boolean) => {
        if (!selectedCells) {
            return;
        }
        const finalColumns = lastLevel.sort((a, b) => a.finalPosition - b.finalPosition);

        let headers = '';

        if (withHeaders) {
            headers =
                finalColumns
                    .slice(selectedCells.start.x, selectedCells.end.x + 1)
                    .map((column) => column.headerName)
                    .join('\t') + '\n';
        }

        const dataToCopy = sortedData
            .slice(selectedCells.start.y, selectedCells.end.y + 1)
            .map((row) => {
                return finalColumns
                    .slice(selectedCells.start.x, selectedCells.end.x + 1)
                    .map((column) => {
                        return row[column.field as string];
                    })
                    .join('\t');
            })
            .join('\n');

        return headers + dataToCopy;
    };

    const handleCopy = (withHeaders: boolean) => {
        const csv = getCsv(withHeaders);
        
        if (!csv) {
            return;
        }
        
        navigator.clipboard.writeText(csv);
    };

    const handleExport = () => {
        const csv = getCsv(true);
        const csvContent = "data:text/csv;charset=utf-8,";

        const encodedUri = encodeURI(csvContent + csv);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const addRowToSlice = (renderArray: ReactNode[][], row: Row, idx: number, level: number, gap: number): number => {
        if (!renderArray[level]) {
            renderArray[level] = [];
        }

        renderArray[level].push(
            <RowContainer
                key={row._id}
                row={row}
                columns={lastLevel}
                columnStore={columns}
                config={config}
                groupOrder={groupOrder}
                idx={idx}
                border={border}
                height={rowHeight}
                level={level}
                onClick={handleRowExpand(row)}
                events={events}
                gap={gaps.current[row._id as string] || 0}
            />
        );

        if (row.children && row._expanded) {
            for (let i = 0; i < row.children.length; i++) {
                const child = row.children[i];
                gap = addRowToSlice(renderArray, child, idx + i + 1, level + 1, gap);

                gap += child?._expanded ? (child.children?.length || 0) * rowHeight : 0;
            }
        }

        return gap;
    };

    const createDataSlice = () => {
        const renderArray: ReactNode[][] = [];
        let gap = 0;
        for (let idx = min; idx < max; idx++) {
            const row = sortedData[idx];

            if (row) {
                gap = addRowToSlice(renderArray, row, idx, 0, gap);
            }

            gap += row?._expanded ? (row.children?.length || 0) * rowHeight : 0;
        }

        return renderArray.flat();
    };

    const getStyleProps = () => {
        return {
            height: (sortedData.length + expandedRows) * rowHeight,
        };
    };

    const dataSlice = createDataSlice();

    return (
        <div className="grid-body" style={getStyleProps()} onContextMenu={handleContextMenu}>
            {dataSlice}
            <ContextMenu
                x={contextMenu?.x || 0}
                y={contextMenu?.y || 0}
                visible={!!contextMenu}
                theme={theme}
                onClose={() => setContextMenu(null)}
                onCopy={handleCopy}
                onExport={handleExport}
            />
        </div>
    );
}
