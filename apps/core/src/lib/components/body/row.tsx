import { Column, ColumnId, ColumnStore, PinType, Row, RowConfig, RowEvents } from '../../common';
import { RowCell } from './row-cell';

import cn from 'classnames';

type Props = {
    row: Row;
    columns: Column[];
    columnStore: ColumnStore;
    groupOrder: ColumnId[];
    y: number;
    idx: number;
    config?: Partial<RowConfig>;
    border?: boolean;
    height: number;
    gap: number;
    level: number;
    events?: Partial<RowEvents>;
    onClick?: () => void;
};

export default function RowContainer({ row, columns, columnStore, groupOrder, config, idx, y, border, height, gap, level, onClick, events }: Props) {
    const visibleColumns = columns.filter((column) => !column.hidden);
    const leftWidth = visibleColumns.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0);
    const totalWidth = visibleColumns.reduce((acc, curr) => acc + curr.width, 0);
    const rightWidth = visibleColumns.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0);
    
    const handleClick = () => {
        if (events?.onClick?.callback) {
            events.onClick.callback(row, idx);
        }

        if (onClick) {
            onClick();
        }
    };

    const renderRow = (pinType: PinType | undefined) => {
        return columns
            .filter((column) => column.pinned === pinType)
            .map((column, cidx) => (
                <RowCell
                    key={cidx}
                    idx={y}
                    height={height}
                    row={row}
                    border={border}
                    columns={columnStore}
                    groupOrder={groupOrder}
                    level={level}
                    config={config}
                    columnDef={column}
                    onClick={handleClick}
                />
            ));
    };

    return (
        <div
            key={idx}
            className={cn('grid-row', level > 0 && 'animate__animated animate__faster animate__fadeIn', {
                child: level > 0,
                expandable: row.children,
                withHighlight: events?.onHover?.highlight,
            })}
            style={{ top: height * idx + gap, height, width: totalWidth }}
        >
            {leftWidth > 0 && (
                <div className="grid-left-pin" style={{ minWidth: leftWidth }}>
                    {renderRow(PinType.LEFT)}
                </div>
            )}
            <div className="grid-row-content" style={{ width: totalWidth }}>
                {renderRow(PinType.NONE)}
            </div>
            {rightWidth > 0 && (
                <div className="grid-right-pin" style={{ minWidth: rightWidth }}>
                    {renderRow(PinType.RIGHT)}
                </div>
            )}
        </div>
    );
}
