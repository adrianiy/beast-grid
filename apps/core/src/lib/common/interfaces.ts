import { CSSProperties } from 'react';
import { DragItem } from './../stores/dnd-store/store';
import { AggregationType, FilterType, OperationType, PinType, SortType } from './enums';
import { EChartsCoreOption } from 'echarts';

export interface Row {
    [key: string]: unknown;
    _id?: string;
    _orignalIdx?: number;
    _hidden?: boolean;
    _level?: number;
    _singleChild?: boolean;
    children?: Row[];
}

export type Data = Row[];

export interface StyleProps {
    width: number;
    minWidth: number;
    maxWidth: number;
    hidden: boolean;
    flex: number;
}

export interface FilterProps {
    filterOptions: IFilter[];
}

export interface MenuProps {
    column: boolean;
    pin: boolean;
    filter: boolean;
    grid: boolean;
}

export type ColumnId = string;

export type NumberFilter = { op: OperationType | undefined; value: number | undefined };
export type ColumnFilter = { label: string; selected: boolean; id: string };
export type IFilter = string | NumberFilter | ColumnFilter | boolean;

export type AggregationFunction = (row: Row) => string | number;

export interface BaseColumnDef {
    id?: ColumnId;
    headerName: string;
    pinned?: PinType;
    field?: string;
    pivotField?: string;
    sortable?: boolean;
    children?: ColumnDef[];
    childrenMap?: Record<string, string>;
    formatter?: (value: string & number, row: Row) => string;
    styleFormatter?: (value: string & number, row: Row) => CSSProperties;
    menu?: Partial<MenuProps>;
    rowGroup?: boolean;
    aggregation?: AggregationType | AggregationFunction;
    _firstLevel?: boolean;
    _total: boolean;
}

export type ColumnDef = Partial<StyleProps> & Partial<FilterProps> & BaseColumnDef;

export interface SortConfig {
    enabled: boolean;
    multiple: boolean;
}
export interface StyleConfig {
    maxHeight: number;
    border: boolean;
}
export interface RowEvents {
    onHover: Partial<{
        highlight: boolean;
        callback: (row: Row, idx: number) => void;
    }>;
    onClick: Partial<{
        callback: (row: Row, idx: number) => void;
    }>;
}

export interface RowGroupConfig {
    showChildName: boolean;
}
export interface RowConfig {
    height: number;
    border: boolean;
    groups: RowGroupConfig;
    events: Partial<RowEvents>;
}
export interface HeaderEvents {
    onDropOutside: Partial<{
        hide: boolean;
        callback: (column: Column) => void;
    }>;
}
export interface HeaderConfig {
    height: number;
    border: boolean;
    events: Partial<HeaderEvents>;
}
export interface DragOptions {
    autoScrollSpeed: number;
    autoScrollMargin: number;
}

export interface TreeConstructor {
    name: string;
    showOriginal: boolean;
    field: string;
    width: number;
    menu: Partial<MenuProps>;
}

export interface ContextualMenuProps {
    copy: boolean;
    export: boolean;
    chart: boolean;
}

export interface ToolBar {
    download: boolean;
    downloadExcel: boolean;
    grid: boolean;
    filter: boolean;
    mode: boolean;
    restore: boolean;
}

export interface Chart {
    defaultValues: Partial<{
        dataColumns: string[];
        categoryColumns: string[];
        chartType: 'line' | 'bar';
    }>;
    groupData: boolean;
    config: Partial<EChartsCoreOption>;
}

export interface PivotValue {
    field: string;
    operation: AggregationType;
}

export interface Pivot {
    enabled: boolean;
    pivotConfig?: {
        rows: string[];
        columns: string[];
        values: PivotValue[];
    };
}

export interface BeastGridConfig<T> extends Partial<TableStyles> {
    columnDefs: ColumnDef[];
    defaultColumnDef?: Partial<ColumnDef>;
    data: T;
    pivot?: Partial<Pivot>;
    sort?: Partial<SortConfig>;
    row?: Partial<RowConfig>;
    header?: Partial<HeaderConfig>;
    style?: Partial<StyleConfig>;
    dragOptions?: Partial<DragOptions>;
    tree?: Partial<TreeConstructor>;
    topToolbar?: Partial<ToolBar>;
    bottomToolbar?: Partial<ToolBar>;
    chart?: Partial<Chart>;
    contextualMenu?: Partial<ContextualMenuProps>;
    appendModalToBoy?: boolean;
}

export interface TableStyles {
    rowHeight: number;
    headerHeight: number;
    border?: boolean;
}

export interface Position {
    top: number;
    left: number;
}

export interface SortState {
    order: SortType;
    priority: number;
}

export interface Column extends ColumnDef, Position {
    id: ColumnId;
    position: number;
    level: number;
    final: boolean;
    width: number;
    pinned: PinType;
    finalPosition: number;
    minPosition?: number;
    maxPosition?: number;
    childrenId?: ColumnId[];
    sort?: SortState;
    parent?: ColumnId;
    original?: ColumnId;
    originalParent?: ColumnId;
    filterType?: FilterType;
    logicDelete?: boolean;
    lastPinned?: boolean;
    tree?: boolean;
}

export type ColumnStore = Record<ColumnId, Column>;
export type ColumnArray = Column[][];

export interface HeaderDrag extends DragItem {
    text: string;
    isInside: boolean;
}

export interface BeastGridApi {
    columns: ColumnStore;
    setColumns: (columns: ColumnStore) => void;
    setLoading: (loading: boolean) => void;
}

export interface Coords {
    x: number;
    y: number;
}

export interface SelectedCells {
    init: Coords;
    start: Coords;
    end: Coords;
}
