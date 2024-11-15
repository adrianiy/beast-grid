import React, { ReactNode, useMemo, useRef } from 'react';

import { Column, ColumnId, ColumnStore, Row, RowConfig } from './../../common/interfaces';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import { Data, LEVEL_PADDING, SelectedCells } from '../../common';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';
import { PivotState } from '../../stores/grid-store/store';
import { getPivotedData } from '../../utils/functions';

function getProperty<Key extends keyof Row>(
    row: Row,
    level: number,
    columnDef: Column,
    columns: ColumnStore,
    groupOrder: ColumnId[],
    data: Data
): string | ReactNode | null {
    let field = columnDef.field;

    if (columnDef.tree) {
        field = columns[groupOrder[level]]?.field || field;
    }

    let value = getPivotedData(row, columnDef, data);

    if (React.isValidElement(value)) {
        return value;
    }

    const columnIdx = groupOrder.indexOf(columnDef.id);

    if (columnIdx >= level) {
        value = row[field as Key] as string;
    } else if (columnIdx > -1) {
        return null;
    }

    if (columnDef.formatter) {
        return columnDef.formatter(value as number & string, row);
    }

    return value?.toString();
}

type Props = {
    idx: number;
    height: number;
    row: Row;
    parent?: Row;
    border?: boolean;
    columnDef: Column;
    selectable: boolean;
    config?: Partial<RowConfig>;
    expandableSibling?: boolean;
    level: number;
    groupOrder: ColumnId[];
    columns: ColumnStore;
    loading?: boolean;
    skeleton: ReactNode;
    onClick?: () => void;
};
export function RowCell({
    height,
    row,
    idx,
    selectable,
    columnDef,
    border,
    expandableSibling,
    level,
    groupOrder,
    columns,
    loading,
    skeleton,
    onClick,
}: Props) {
    const lastSelected = useRef<SelectedCells | null>(null);
    const [
        data,
        pivot,
        scrollElement,
        selectedCells,
        setSelectedStart,
        setSelectedEnd,
        updateSelected,
        selecting,
        setSelecting,
    ] = useBeastStore((state) => [
        state.data,
        state.pivot,
        state.scrollElement,
        state.selectedCells,
        state.setSelectedStart,
        state.setSelectedEnd,
        state.updateSelectedCells,
        state.selecting,
        state.setSelecting,
    ]);
    const inY = selectedCells && idx >= selectedCells.start.y && idx <= selectedCells.end.y;
    const inX =
        selectedCells &&
        columnDef.finalPosition >= selectedCells.start.x &&
        columnDef.finalPosition <= selectedCells.end.x;
    const selected = inY && inX;
    const borderTop = idx === selectedCells?.start.y;
    const borderLeft = columnDef.finalPosition === selectedCells?.start.x;
    const borderBottom = idx === selectedCells?.end.y;
    const borderRight = columnDef.finalPosition === selectedCells?.end.x;

    const value = useMemo(() => {
        return getProperty(row, level, columnDef, columns, groupOrder, data);
    }, [row, level, columnDef, columns, groupOrder]);

    if (columnDef.hidden || !columnDef.inView) {
        return null;
    }


    const handleMouseDown = (e: React.MouseEvent) => {
        const clickOnYScrollbar = e.clientY > scrollElement?.getBoundingClientRect().bottom - 11;
        const clickOnXScrollbar = e.clientX > scrollElement?.getBoundingClientRect().right - 11;

        if (e.shiftKey || clickOnYScrollbar || clickOnXScrollbar || !selectable) {
            return;
        }
        if (e.button === 2 && selected) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        setSelectedStart({ x: columnDef.finalPosition, y: idx });
        setSelecting(true);
    };

    const handleMouseEnter = () => {
        if (selecting) {
            setSelectedEnd({ x: columnDef.finalPosition, y: idx });
        }
    };

    const handleMouseUp = () => {
        if (!selectable) {
            return;
        }
        if (!lastSelected.current) {
            lastSelected.current = selectedCells;
        } else {
            const oneCell =
                lastSelected.current &&
                lastSelected.current.start.x === lastSelected.current.end.x &&
                lastSelected.current.start.y === lastSelected.current.end.y;

            if (oneCell) {
                updateSelected(null);
                lastSelected.current = null;
            }
        }
        setSelecting(false);
    };

    const handleMouseClick = (e: React.MouseEvent) => {
        const coords = { x: columnDef.finalPosition, y: idx };
        if (e.shiftKey && selectable) {
            setSelectedEnd(coords);
        }
    };

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            data-hidden={columnDef.hidden}
            className={cn('grid-row-cell', {
                lastPinned: columnDef.lastPinned,
                expandable: row.children || columnDef.rowGroup,
                bordered: border,
                totalRow: row._total,
                totalColumn: columnDef._total,
                selected,
                borderTop,
                borderLeft,
                borderBottom,
                borderRight,
            })}
            style={{
                height,
                left: columnDef.left,
                paddingLeft:
                    LEVEL_PADDING +
                    (expandableSibling && row._singleChild && columnDef.rowGroup && !columnDef.tree && !pivot?.rows
                        ? LEVEL_PADDING + 2
                        : 0) +
                    (columnDef.tree ? LEVEL_PADDING * level : 0) +
                    (columnDef.tree && !row.children && !pivot ? LEVEL_PADDING : 0),
                width: columnDef.width,
                ...columnDef.styleFormatter?.(row[columnDef.field as string] as string & number, row, idx),
            }}
            onClick={handleMouseClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
        >
            {React.isValidElement(value) ? (
                value
            ) : (
                <>
                    <Chevron
                        onClick={handleExpandClick}
                        row={row}
                        columnDef={columnDef}
                        groupOrder={groupOrder}
                        enabled={expandableSibling}
                        level={level}
                        pivot={pivot}
                    />
                    <div className="grid-row-value">{loading ? skeleton : value}</div>
                </>
            )}
        </div>
    );
}

const Chevron = ({
    onClick,
    row,
    columnDef,
    groupOrder,
    enabled,
    level,
    pivot,
}: {
    onClick: (e: React.MouseEvent) => void;
    row: Row;
    columnDef: Column;
    groupOrder: ColumnId[];
    enabled?: boolean;
    pivot?: Partial<PivotState> | null;
    level: number;
}) => {
    if (!enabled && !pivot) {
        return null;
    }

    if (pivot && !pivot?.rowTotals) {
        return null;
    }
    if (
        !row.children ||
        !columnDef.rowGroup ||
        (groupOrder[level] !== columnDef.id && !columnDef.tree) ||
        (row.children.length === 1 && !pivot)
    ) {
        return null;
    }

    if (level === groupOrder.length && row.children?.length === 1) {
        return null;
    }

    return (
        <ChevronRightIcon
            className={cn(!!row._expanded && 'active', { single: row._singleChild })}
            onMouseDown={onClick}
        />
    );
};
