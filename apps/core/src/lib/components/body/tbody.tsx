import { ReactNode, useEffect, useRef, useState } from 'react';
import useBus from 'use-bus';

import { useBeastStore } from './../../stores/beast-store';
import { filterRow, sortData } from '../../utils/functions';

import RowContainer from './row';
import ContextMenu from '../contextMenu/context-menu';
import Chart from '../../chart';

import { BeastGridConfig, BusActions, Column, Coords, Data, Row, RowConfig, RowEvents } from '../../common';

import './tbody.scss';

type TBodyProps<T> = {
    rowHeight: number;
    headerHeight: number;
    beastConfig: BeastGridConfig<T>;
    config?: Partial<RowConfig>;
    maxHeight?: number;
    border?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
    filters?: Record<string, string[]>;
    events?: Partial<RowEvents>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 5;

export default function TBody<T>({
    rowHeight,
    headerHeight,
    config,
    beastConfig,
    maxHeight,
    border,
    onSortChange,
    events,
}: TBodyProps<T>) {
    const gaps = useRef<Record<string, number>>({});
    const [
        data,
        columns,
        sortedColumns,
        theme,
        container,
        scrollElement,
        sort,
        filters,
        setSorting,
        groupOrder,
        setSelecting,
        selectedCells,
        updateSelected
    ] = useBeastStore((state) => [
        state.data,
        state.columns,
        state.sortedColumns,
        state.theme,
        state.container,
        state.scrollElement,
        state.sort,
        state.filters,
        state.setSorting,
        state.groupOrder,
        state.setSelecting,
        state.selectedCells,
        state.updateSelectedCells
    ]);
    const [expandedRows, setExpandedRows] = useState<number>(0);
    const [lastScroll, setLastScroll] = useState<number>(0);
    const [[max, min], setMaxMin] = useState([0, 0]);
    const [sortedData, setSortedData] = useState<Data>([]);
    const [contextMenu, setContextMenu] = useState<Coords | null>(null);
    const [chartColumns, setChartColumns] = useState<Column[]>([]);
    const [chartData, setChartData] = useState<Data>([]);
    const [chartVisible, setChartVisible] = useState<boolean>(false);

    const levels = Object.values(columns).reduce((acc, column) => {
        const level = column.level || 0;
        acc[level] = acc[level] || [];
        acc[level].push(column);
        return acc;
    }, [] as Column[][]);

    useEffect(() => {
        updateSelected(null)
    }, [sortedColumns, updateSelected])

    useEffect(() => {
        const updateLastScroll = () => {
            if (scrollElement) {
                setLastScroll(scrollElement.scrollTop);
            }
        };
        if (scrollElement && container) {
            scrollElement.addEventListener('scroll', updateLastScroll);
        }

        return () => {
            if (scrollElement) {
                scrollElement.removeEventListener('scroll',updateLastScroll);
            }
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
        
        updateSelected(null);
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
            updateSelected(null);
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
        updateSelected(null)
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

    const getActionData = (_data: Row[], limit = 0): Row[] => {
        let y = 0;
        const actionData = [];
        while (y < limit - 1) {
            const row = _data[y];

            if (!row) {
                break;
            }
            actionData.push(row);

            if (row._expanded && row.children) {
                actionData.push(...getActionData(row.children, row.children.length));

                y += row.children.length;
            } else {
                y++;
            }
        }

        return actionData;
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
                    .map((column) => column.headerName).join('\t') + '\n';
        }


        const actionData = getActionData(sortedData, selectedCells.end.y + 1);

        const csvData = actionData
            .map((row) => {
                return finalColumns
                    .slice(selectedCells.start.x, selectedCells.end.x + 1)
                    .map((column) => {
                        return row[column.field as string];
                    })
                    .join('\t');
            })
            .join('\n');


        return headers + csvData;
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
        const csvContent = 'data:text/csv;charset=utf-8,';

        const encodedUri = encodeURI(csvContent + csv);

        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `data-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleChartOpen = () => {
        if (!selectedCells) {
            return;
        }
        const finalColumns = lastLevel.sort((a, b) => a.finalPosition - b.finalPosition);
        console.log(finalColumns, selectedCells)


        const chartColumns =
            finalColumns
                .slice(selectedCells?.start.x, selectedCells.end.x + 1)

        const actionData = getActionData(sortedData, selectedCells.end.y + 1);

        console.log(chartColumns, actionData);
        setChartColumns(chartColumns);
        setChartData(actionData);
        setChartVisible(true);
        setContextMenu(null);
    }

    const addRowToSlice = (
        renderArray: ReactNode[][],
        row: Row,
        idx: number,
        y: number,
        level: number,
        gap: number
    ): number => {
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
                y={y}
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
                gap = addRowToSlice(renderArray, child, idx + i + 1, y + i + 1, level + 1, gap);

                gap += child?._expanded ? (child.children?.length || 0) * rowHeight : 0;
            }
        }

        return gap;
    };

        const createDataSlice = () => {
            const renderArray: ReactNode[][] = [];
            let gap = 0;
            let y = 0;
            for (let idx = min; idx < max; idx++) {
                const row = sortedData[idx];

                if (row) {
                    gap = addRowToSlice(renderArray, row, idx, y, 0, gap);

                    if (row._expanded) {
                        y += row.children?.length || 0;
                    }
                }

                gap += row?._expanded ? (row.children?.length || 0) * rowHeight : 0;
                y++;
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
                    onChartOpen={handleChartOpen}
                />
                <Chart modal visible={chartVisible} data={chartData} columns={chartColumns} config={beastConfig} onClose={() => setChartVisible(false)} />
            </div>
        );
    }
