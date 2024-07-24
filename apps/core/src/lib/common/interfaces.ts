import { CSSProperties, ReactNode } from 'react';
import { DragItem } from './../stores/dnd-store/store';
import { AggregationType, ChangeType, FilterType, MathType, Operation, OperationType, PinType, SortType } from './enums';
import { EChartsCoreOption } from 'echarts';

export interface Row {
    [key: string]: unknown;
    _id?: string;
    _orignalIdx?: number;
    _hidden?: boolean;
    _level?: number;
    _singleChild?: boolean;
    _pivotIndexes?: number[];
    _childrenMap?: Record<string, number>;
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
    sortable?: boolean;
    children?: ColumnDef[];
    childrenMap?: Record<string, string>;
    formatter?: (value: string & number, row: Row) => string;
    styleFormatter?: (value: string & number, row: Row) => CSSProperties;
    menu?: Partial<MenuProps> | boolean;
    rowGroup?: boolean;
    aggregation?: AggregationType | AggregationFunction;
    sort?: SortState;
    _firstLevel?: boolean;
    _filters?: Record<string, string>;
    _total?: boolean;
    _summary?: boolean;
}

export type ColumnDef = Partial<StyleProps> & Partial<FilterProps> & BaseColumnDef;

export interface SortConfig {
    enabled: boolean;
    multiple: boolean;
}
export interface StyleConfig {
    maxHeight: number | string;
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

export interface ToolBarButton {
    enabled: boolean;
    active: boolean;
}

export interface ToolBar {
    download: Partial<ToolBarButton> | boolean;
    downloadExcel: Partial<ToolBarButton> | boolean;
    grid: Partial<ToolBarButton> | boolean;
    pivot: Partial<ToolBarButton> | boolean;
    filter: Partial<ToolBarButton> | boolean;
    mode: Partial<ToolBarButton> | boolean;
    restore: Partial<ToolBarButton> | boolean;
    history: Partial<ToolBarButton> | boolean;
    custom: ReactNode;
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

export interface AsyncRow extends Row {
    _id: string;
    _total: boolean;
}

export interface PivotState {
    columns: Column[];
    rows: Column[];
    values: Column[];
    data: Data;
    enabled: boolean;
    columnTotals: boolean;
    rowTotals: boolean;
    rowGroups: boolean;
}

export interface PivotConfig {
    rows: string[];
    columns: string[];
    values: PivotValue[];
    rowTotals: boolean;
    columnTotals: boolean;
    rowGroups: boolean;

}

export interface Pivot {
    enabled: boolean;
    asyncCallback: (pivot: Partial<PivotState | null>) => Promise<AsyncRow[]>
    applyButton: boolean;
    totalizable: boolean;
    pivotConfig?: PivotConfig;
}

export interface Loading {
    skeleton: ReactNode;
    rows: number;
}

export interface BeastGridConfig<T> extends Partial<TableStyles> {
    columnDefs: ColumnDef[];
    defaultColumnDef?: Partial<ColumnDef>;
    data: T;
    topRows?: Data;
    bottomRows?: Data;
    pivot?: Partial<Pivot>;
    sort?: Partial<SortConfig>;
    row?: Partial<RowConfig>;
    header?: Partial<HeaderConfig>;
    style?: Partial<StyleConfig>;
    dragOptions?: Partial<DragOptions>;
    tree?: Partial<TreeConstructor>;
    topToolbar?: Partial<ToolBar>;
    topLeftToolbar?: Partial<ToolBar>;
    bottomToolbar?: Partial<ToolBar>;
    bottomLeftToolbar?: Partial<ToolBar>;
    chart?: Partial<Chart>;
    contextualMenu?: Partial<ContextualMenuProps>;
    appendModalToBoy?: boolean;
    loadingState?: Partial<Loading>;
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
    temporal?: boolean;
}

export interface Column extends ColumnDef, Position {
    id: ColumnId;
    position: number;
    level: number;
    final: boolean;
    width: number;
    pinned: PinType;
    finalPosition: number;
    inView?: boolean;
    minPosition?: number;
    maxPosition?: number;
    childrenId?: ColumnId[];
    parent?: ColumnId;
    original?: ColumnId;
    originalParent?: ColumnId;
    filterType?: FilterType;
    logicDelete?: boolean;
    lastPinned?: boolean;
    tree?: boolean;
    _filters?: Record<string, string>;
    _summary?: boolean;
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
    setData: (data: Data) => void;
    clearHistory: () => void;
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

export interface SortChanges {
    sortColumns: Column[];
}

export interface SwapChanges {
    columns: ColumnStore;
    sortedColumns: Column[];
}

export interface PivotChanges {
    pivot: Partial<PivotState>;
}

export interface VisibilityChanges {
    hiddenColumns: Column[]
}

export interface Changes extends Partial<SortChanges>, Partial<SwapChanges>, Partial<PivotChanges>, Partial<VisibilityChanges> { }

export type OnChanges = (changeType: ChangeType, changes: Changes) => void;

export interface MathCell {
    type: MathType;
    cell: string;
}

export type Operand = MathCell | Formula;

export interface Formula {
    left: Operand | null;
    right: Operand | null;
    operation: Operation | null;
    type: MathType;
}
