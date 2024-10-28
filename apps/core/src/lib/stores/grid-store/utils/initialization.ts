import { v4 as uuidv4 } from 'uuid';
import {
    ColumnDef,
    ColumnStore,
    Column,
    Data,
    Row,
    PinType,
    ColumnId,
    TreeConstructor,
    FilterType,
    AggregationType,
} from '../../../common';

import { MIN_COL_WIDTH } from './../../../common/globals';
import { groupBy } from '../../../utils/functions';

import deepmerge from 'deepmerge';
import { createGroupColumn } from './group';
import { toggleHide } from './edition';
import dayjs from 'dayjs';

const loopColumns = (
    levelIndexes: Record<number, number>,
    columnDefs: ColumnDef[],
    defaultColumnDef?: Partial<ColumnDef>,
    level = 0,
    parent?: Column
): ColumnStore => {
    if (!levelIndexes[level]) {
        levelIndexes[level] = 0;
    }

    const columns: ColumnStore = {};
    // Loop through columnDefs
    // Create column object
    // If column has children, call getColumnsFromDefs recursively
    columnDefs.forEach((columnDef) => {
        const id = columnDef.id ?? uuidv4();
        const column: Column = {
            ...deepmerge(defaultColumnDef || {}, columnDef),
            children: [],
            width: columnDef.width || 0,
            position: levelIndexes[level],
            finalPosition: levelIndexes[level],
            minPosition: levelIndexes[level],
            maxPosition: levelIndexes[level],
            pinned: parent?.pinned || columnDef.pinned || PinType.NONE,
            top: 0,
            left: 0,
            final: !columnDef.children || columnDef.children.length === 0,
            id,
            parent: parent?.id,
            path: parent?.path ? [...parent.path, parent.id] : [],
            level,
        };
        columns[id] = column;
        levelIndexes[level]++;

        if (columnDef.children) {
            const minPosition = levelIndexes[level + 1] || 0;
            const childrenColumns = loopColumns(levelIndexes, columnDef.children, defaultColumnDef, level + 1, column);
            const maxPosition = levelIndexes[level + 1] - 1;
            column.childrenId = Object.values(childrenColumns)
                .filter((c) => c.level === level + 1)
                .map((c) => c.id);
            column.width = Object.values(childrenColumns).reduce((acc, c) => acc + (c.width || 0), 0);
            column.minPosition = minPosition;
            column.maxPosition = maxPosition;

            Object.assign(columns, childrenColumns);
        }
    });

    return columns;
};

export const getColumnsFromDefs = (
    columnDefs: ColumnDef[],
    defaultColumnDef?: Partial<ColumnDef>,
    level = 0,
    parent?: Column
): ColumnStore => {
    // If no columnDefs, return empty object
    if (columnDefs.length === 0) {
        return {};
    }

    const levelIndexes = {};

    const columns = loopColumns(levelIndexes, columnDefs, defaultColumnDef, level, parent);

    // Return columns
    return columns;
};

export const createVirtualIds = (data: Data): Data => {
    const newData = data.map((row, idx) => {
        return {
            ...row,
            _id: uuidv4(),
            _originalIdx: idx,
            children: row.children ? createVirtualIds(row.children) : undefined,
        };
    });

    return [...newData];
};

export const groupDataByColumnDefs = (
    columns: ColumnStore,
    data: Data,
    groupOrder: ColumnId[],
    level = 0,
    pivoting = false
): Data => {
    const aggColumns = Object.values(columns).filter((col) => col.aggregation);
    const aggregationLevel = columns[groupOrder[level]];

    if (!aggregationLevel) {
        return data;
    }

    const finalData: Row[] = groupBy(data, aggregationLevel, aggColumns, columns);

    finalData.forEach((row) => {
        row.children = groupDataByColumnDefs(columns, row.children || [], groupOrder, level + 1, pivoting);
        row.children.forEach((child) => {
            child._level = level + 1;
        });

        if (pivoting) {
            if (groupOrder.length - 1 === level) {
                row.children = undefined;
                row._singleChild = true;
            } else {
                row._singleChild = false;
            }
        }
    });

    return finalData;
};

export const getColumnArrayFromDefs = (columnStore: ColumnStore): Column[][] => {
    const columns = Object.values(columnStore).reduce((acc, column) => {
        if (!acc[column.level]) {
            acc[column.level] = [];
        }
        acc[column.level].push(column);
        return acc;
    }, [] as Column[][]);

    return columns;
};

const _getColumnHeaderWidth = (column: Column): number | undefined => {
    if (!column.headerName) {
        return undefined;
    }

    return ((column.headerName.length * 10) + 100) || 0;
}

const _getChildrenWidth = (column: Column, columnStore: ColumnStore): void => {
    if (column.hidden) {
        return;
    }
    if (!column.childrenId?.length) {
        column.width = column.width || _getColumnHeaderWidth(column) || MIN_COL_WIDTH;
    }

    if (column.childrenId?.length) {
        column.childrenId?.forEach((childId) => {
            _getChildrenWidth(columnStore[childId], columnStore);
        });

        column.width = column.childrenId.reduce((acc, childId) => acc + columnStore[childId].width, 0);
    }
};


export const setColumnsStyleProps = (columnStore: ColumnStore, containerWidth: number): ColumnStore => {
    const finalColumns = Object.values(columnStore).filter((column) => column.final && !column.hidden);
    const notFinalColumns = Object.values(columnStore).filter((column) => !column.final && !column.hidden);
    const dynamicColumns = finalColumns.filter((column) => !column.width || column.flex);
    const totalFlex = dynamicColumns.reduce((acc, column) => acc + (column.flex ?? 0), 0);

    // Calculate width for user defined columns
    const fixedWidth = finalColumns.reduce(
        (acc, column) => acc + (!column.flex ? column.width || _getColumnHeaderWidth(column) || MIN_COL_WIDTH : 0),
        0
    );

    // Calculate width remaining for non forced width columns
    const remainingWidth = containerWidth - fixedWidth;

    // Set width for flex columns
    dynamicColumns.forEach((column) => {
        const flexWidth = ((column.flex ?? 0) / totalFlex) * remainingWidth;
        column.width = Math.max(flexWidth, column.minWidth || _getColumnHeaderWidth(column) || MIN_COL_WIDTH);
    });

    // Calculate parent widths based on children
    notFinalColumns.forEach((column) => {
        if (column.level === 0) {
            _getChildrenWidth(column, columnStore);
        }
    });

    return columnStore;
};

export const getColumnFilter = (column: Column, data: Data): void => {
    if (typeof data[0][column.field as string] === 'number') {
        column.filterType = FilterType.NUMBER;
        return;
    }
    if (typeof data[0][column.field as string] === 'boolean') {
        column.filterType = FilterType.BOOLEAN;
        return;
    }
    if (dayjs(data[0][column.field as string] as string).isValid()) {
        column.filterType = FilterType.DATE;
        return;
    }
    if (typeof data[0][column.field as string] === 'string') {
        column.filterType = FilterType.TEXT;
        return;
    }
}

export const setColumnFilters = (columns: ColumnStore, data: Data) => {
    if (!data.length) {
        return;
    }
    Object.values(columns).forEach((column) => {
        getColumnFilter(column, data);
    });
};

export const setColumnAggregationDefaults = (columns: ColumnStore, data: Data) => {
    Object.values(columns).forEach((column) => {
        if (column.aggregation) {
            return;
        }

        if (typeof data[0][column.field as string] === 'number') {
            column.aggregation = AggregationType.SUM;
        } else {
            column.aggregation = AggregationType.COUNT;
        }
    });
};

export const initialize = (
    columns: ColumnStore,
    container: HTMLDivElement,
    data: Data,
    groupOrder: ColumnId[],
    tree?: Partial<TreeConstructor>
): [Data, ColumnStore] => {
    if (tree) {
        groupOrder.forEach((id) => {
            const column = columns[id];

            const newColumn = createGroupColumn(column, columns, tree);
            if (tree && !tree.showOriginal) {
                toggleHide(column, columns);
            }
            newColumn.rowGroup = true;
        });
        setColumnsStyleProps(columns, container.offsetWidth);
    }
    const finalData = groupDataByColumnDefs(columns, data, groupOrder);
    setColumnsStyleProps(columns, container.offsetWidth);
    setColumnFilters(columns, data);

    return [finalData, columns];
};
