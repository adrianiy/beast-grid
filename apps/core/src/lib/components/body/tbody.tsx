import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useBus from 'use-bus';

import { useBeastStore } from './../../stores/beast-store';
import { resetSortColumns, sortData } from '../../utils/functions';

import RowContainer from './row';
import ContextMenu from '../contextMenu/context-menu';
import Chart from '../../chart';

import { BeastGridConfig, BusActions, Column, Coords, Data, Row, RowConfig, RowEvents } from '../../common';

import './tbody.scss';

type TBodyProps<T> = {
    rowHeight: number;
    beastConfig: BeastGridConfig<T>;
    config?: Partial<RowConfig>;
    border?: boolean;
    filters?: Record<string, string[]>;
    events?: Partial<RowEvents>;
    scrollTop: number;
    scrollElement: HTMLElement;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

const PERFORMANCE_LIMIT = 1000000;
const THRESHOLD = 5;

const getMaxMin = (
    scrollElement: HTMLElement,
    rowHeight: number,
    scrollTop: number,
    dataLength: number,
    expandedRows: number
): [number, number] => {
    const containerHeight = scrollElement?.getBoundingClientRect().height;
    const visibleRows = Math.floor(containerHeight / rowHeight);
    const topRow = Math.floor(scrollTop / rowHeight);
    const bottomRow = topRow + visibleRows;
    const maxValue = Math.min(dataLength + expandedRows, bottomRow + THRESHOLD);
    const minValue = Math.max(0, topRow - THRESHOLD - expandedRows);

    return [maxValue, minValue]
}

export default function TBody<T>({
    rowHeight,
    config,
    beastConfig,
    border,
    events,
    scrollTop,
    scrollElement,
    onSortChange,
}: TBodyProps<T>) {
    const gaps = useRef<Record<string, number>>({});
    const [
        data,
        pivotData,
        groupData,
        bottomRows,
        topRows,
        columns,
        sortedColumns,
        theme,
        sort,
        filters,
        setSorting,
        groupOrder,
        setSelecting,
        selectedCells,
        updateSelected,
    ] = useBeastStore((state) => [
        state.data,
        state.pivotData,
        state.groupData,
        state.bottomRows,
        state.topRows,
        state.columns,
        state.sortedColumns,
        state.theme,
        state.sort,
        state.filters,
        state.setSorting,
        state.groupOrder,
        state.setSelecting,
        state.selectedCells,
        state.updateSelectedCells,
    ]);
    const [expandedRows, setExpandedRows] = useState<number>(0);
    const [[max, min], setMaxMin] = useState([0, 0]);
    const [sortedData, setSortedData] = useState<Data>([]);
    const [contextMenu, setContextMenu] = useState<Coords | null>(null);
    const [chartColumns, setChartColumns] = useState<Column[]>([]);
    const [chartData, setChartData] = useState<Data>([]);
    const [chartVisible, setChartVisible] = useState<boolean>(false);


    useEffect(() => {
        updateSelected(null);
    }, [sortedColumns, updateSelected]);

    useLayoutEffect(() => {
        if (sortedData.length) {
            setTimeout(() => setMaxMin(getMaxMin(scrollElement, rowHeight, scrollTop, sortedData.length, expandedRows)), 200);
        }
    }, [sortedData.length]);

    useLayoutEffect(() => {
        if (sortedData.length) {
            setMaxMin(getMaxMin(scrollElement, rowHeight, scrollTop, sortedData.length, expandedRows));
        }
    }, [scrollTop, expandedRows, filters]);

    const currentData = useMemo(() => {
        if (groupData?.length) {
            return groupData;
        }
        if (pivotData?.length) {
            return pivotData;
        }

        return data;
    }, [data, pivotData, groupData]);

    useEffect(() => {
        if (!currentData.length) {
            return;
        }

        gaps.current = {};

        const someActive = Object.entries(filters).some(
            ([key, value]) => value.length && value.length !== columns[key].filterOptions?.length
        );
        const newSortedData = someActive ? (currentData.filter(row => !row._hidden) as Row[]) : currentData;

        const sortColumns = Object.values(columns)
            .filter((c) => c.sort)
            .sort((a, b) => (a.sort?.priority || 0) - (b.sort?.priority || 0));

        const asyncSort = async () => {
            if (onSortChange) {
                const result = await onSortChange(newSortedData, sortColumns);

                updateGaps(0, result);

                if (result) {
                    setSortedData(result);
                }
            } else {
                if (newSortedData.length > PERFORMANCE_LIMIT) {
                    setSorting(true);
                }
                setTimeout(() => {
                    newSortedData.sort(sortData(sortColumns, data));
                    resetSortColumns(sortColumns);
                    updateGaps(0, newSortedData);

                    setSortedData([...newSortedData]);

                    if (currentData.length > PERFORMANCE_LIMIT) {
                        setTimeout(() => setSorting(false), 100);
                    }
                }, 0);
            }
        };

        if (!sort) {
            setSortedData(newSortedData);
        } else {
            asyncSort();
        }
        updateSelected(null);

        const [, expanded] = updateGaps(0, newSortedData);

        setExpandedRows(expanded);

        updateSelected(null);
    }, [currentData, filters, sort]);

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
        updateSelected(null);

        if (row._expanded) {
            collapseRow(row);
        } else {
            expandRow(row);
        }
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        if (chartVisible) {
            return;
        }
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
        setSelecting(false);
    };

    const getActionData = (_data: Row[], start = 0, end = 0, y = 0): [Row[], number] => {
        const actionData = [];
        for (let i = 0; i < _data.length; i++) {
            const row = _data[i];
            if (y > end) {
                break;
            }
            if (y >= start) {
                actionData.push(row);
            }

            if (row._expanded && row.children) {
                const [children, nextY] = getActionData(row.children, start, end, y + 1);

                if (children.length) {
                    actionData.push(...children);
                }

                y = nextY;
            } else {
                y++;
            }
        }
        return [actionData, y];
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

        const actionData = getActionData(sortedData, selectedCells.start.y, selectedCells.end.y)[0];

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

        const chartColumns = finalColumns.slice(selectedCells?.start.x, selectedCells.end.x + 1);

        const actionData = getActionData(sortedData, selectedCells.start.y, selectedCells.end.y)[0];

        setChartColumns(chartColumns);
        setChartData(actionData);
        setChartVisible(true);
        setContextMenu(null);
    };

    const addRowToSlice = (
        renderArray: ReactNode[][],
        row: Row,
        idx: number,
        y: number,
        level: number,
        gap: number,
        expandableSibling: boolean
    ): [number, number] => {
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
                selectable={!!beastConfig.contextualMenu}
                idx={idx + (beastConfig.topRows?.length || 0)}
                fullWidth={beastConfig?.fullWidth}
                y={y}
                border={border}
                height={rowHeight}
                level={level}
                onClick={handleRowExpand(row)}
                events={events}
                gap={gaps.current[row._id as string] || 0}
                expandableSibling={expandableSibling}
            />
        );

        if (row.children && row._expanded) {
            y++;
            for (let i = 0; i < row.children.length; i++) {
                const child = row.children[i];
                [gap, y] = addRowToSlice(
                    renderArray,
                    child,
                    idx + i + 1,
                    y + i,
                    level + 1,
                    gap,
                    row.children.some((r) => (r.children?.length || 0) > 1)
                );

                gap += child?._expanded ? (child.children?.length || 0) * rowHeight : 0;
            }
        }
        if (row._expanded) {
            y += row.children?.length || 0;
        }

        return [gap, y];
    };

    const createDataSlice = () => {
        const renderArray: ReactNode[][] = [];
        const expandableSibling = sortedData.some((row) => (row.children?.length || 0) > 1);

        let gap = 0;
        let y = min;

        for (let idx = min; idx < max; idx++) {
            const row = sortedData[idx];

            if (row) {
                [gap, y] = addRowToSlice(renderArray, row, idx, y, 0, gap, expandableSibling);
            }

            gap += row?._expanded ? (row.children?.length || 0) * rowHeight : 0;
            y++;
        }

        return renderArray.flat();
    };

    const createLoadingSlice = () => {
        const renderArray: ReactNode[] = [];
        for (let i = 0; i < (beastConfig?.loadingState?.rows || 10); i++) {
            const row = (
                <RowContainer
                    key={i}
                    row={{} as Row}
                    columns={lastLevel}
                    columnStore={columns}
                    config={config}
                    loading
                    skeleton={beastConfig?.loadingState?.skeleton}
                    groupOrder={groupOrder}
                    selectable={false}
                    idx={i}
                    y={i}
                    border={border}
                    height={rowHeight}
                    level={0}
                    events={events}
                    gap={0}
                    expandableSibling={false}
                />
            );
            renderArray.push(row);
        }

        return renderArray.flat();
    };

    const createTopRows = () => {
        if (!beastConfig.topRows && !topRows) {
            return null;
        }
        const _data = beastConfig.topRows || topRows || [];
        const renderArray: ReactNode[] = [];
        for (let i = 0; i < _data.length; i++) {
            const row = (
                <RowContainer
                    key={i}
                    row={_data[i] as Row}
                    columns={lastLevel}
                    columnStore={columns}
                    config={config}
                    skeleton={beastConfig?.loadingState?.skeleton}
                    groupOrder={groupOrder}
                    selectable={false}
                    fullWidth={beastConfig?.fullWidth}
                    idx={i}
                    y={i}
                    border={border}
                    height={rowHeight}
                    level={0}
                    events={events}
                    gap={0}
                    expandableSibling={false}
                    isTopFixed
                    isLastRow={i === _data.length - 1}
                />
            );
            renderArray.push(row);
        }

        return renderArray.flat();
    };

    const createBottomRows = () => {
        if (!beastConfig.bottomRows && !bottomRows) {
            return null;
        }
        const _data = beastConfig.bottomRows || bottomRows || [];

        const renderArray: ReactNode[] = [];
        for (let i = 0; i < _data.length; i++) {
            const row = (
                <RowContainer
                    key={i}
                    row={_data[i] as Row}
                    columns={lastLevel}
                    columnStore={columns}
                    config={config}
                    skeleton={beastConfig?.loadingState?.skeleton}
                    groupOrder={groupOrder}
                    selectable={false}
                    fullWidth={beastConfig?.fullWidth}
                    idx={i}
                    y={_data.length - i}
                    border={border}
                    height={rowHeight}
                    level={0}
                    events={events}
                    gap={0}
                    expandableSibling={false}
                    isBottomFixed
                    isLastRow={i === _data.length - 1}
                />
            );
            renderArray.push(row);
        }

        return renderArray.flat();
    };

    const getStyleProps = () => {
        return {
            height: sortedData.length
                ? (sortedData.length + expandedRows + (beastConfig?.topRows?.length || topRows?.length || 0) + (beastConfig?.bottomRows?.length || bottomRows?.length || 0)) * rowHeight
                : (beastConfig?.loadingState?.rows || 10) * rowHeight,
        };
    };

    const dataSlice = sortedData.length ? createDataSlice() : createLoadingSlice();
    const topRowsSlice = createTopRows();
    const bottomRowsSlice = createBottomRows();

    return (
        <div className="grid-body" style={getStyleProps()} onContextMenu={handleContextMenu}>
            {topRowsSlice}
            {dataSlice}
            {bottomRowsSlice}
            <ContextMenu
                x={contextMenu?.x || 0}
                y={contextMenu?.y || 0}
                config={beastConfig}
                visible={!!contextMenu}
                theme={theme}
                onClose={() => setContextMenu(null)}
                onCopy={handleCopy}
                onExport={handleExport}
                onChartOpen={handleChartOpen}
            />
            <Chart
                modal
                visible={chartVisible}
                data={chartData}
                activeColumns={chartColumns}
                config={beastConfig}
                onClose={() => setChartVisible(false)}
            />
        </div>
    );
}
