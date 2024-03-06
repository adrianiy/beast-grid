import { Column, ColumnId, ColumnStore, PinType, Row, RowConfig, RowEvents } from '../../common';
import { RowCell } from './row-cell';

import cn from 'classnames';

type Props = {
    row: Row;
    columns: Column[];
    columnStore: ColumnStore;
    groupOrder: ColumnId[];
    idx: number;
    config?: Partial<RowConfig>;
    border?: boolean;
    height: number;
    gap: number;
    level: number;
    events?: Partial<RowEvents>;
    onClick?: () => void;
};

const LEVEL_PADDING = 16;

export default function RowContainer({ row, columns, columnStore, groupOrder, config, idx, border, height, gap, level, onClick, events }: Props) {
    const visibleColumns = columns.filter((column) => !column.hidden);
    const leftWidth = visibleColumns.reduce((acc, curr) => acc + (curr.pinned === PinType.LEFT ? curr.width : 0), 0);
    const totalWidth = visibleColumns.reduce((acc, curr) => acc + curr.width, 0);
    const rightWidth = visibleColumns.reduce((acc, curr) => acc + (curr.pinned === PinType.RIGHT ? curr.width : 0), 0);

    const renderRow = (pinType: PinType | undefined) => {
        return columns
            .filter((column) => column.pinned === pinType)
            .map((column, idx) => (
                <RowCell
                    key={idx}
                    height={height}
                    row={row}
                    columns={columnStore}
                    groupOrder={groupOrder}
                    level={level}
                    config={config}
                    columnDef={column}
                    paddingLeft={LEVEL_PADDING * (column.rowGroup && !row.children ? level : 1)}
                />
            ));
    };

    const handleClick = () => {
        if (events?.onClick?.callback) {
            events.onClick.callback(row, idx);
        }

        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            key={idx}
            className={cn('grid-row', level > 1 && 'animate__animated animate__faster animate__fadeIn', {
                child: level > 1,
                bordered: border,
                expandable: row.children,
                withHighlight: events?.onHover?.highlight,
            })}
            style={{ top: height * idx + gap, height, width: totalWidth }}
            onClick={handleClick}
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
