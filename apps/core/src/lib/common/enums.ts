export enum ItemTypes {
    COLUMN = 'column',
}

export enum SortType {
    ASC = 'asc',
    DESC = 'desc',
}

export enum Direction {
    LEFT = 'left',
    RIGHT = 'right',
}

export enum AggregationType {
    SUM = 'sum',
    AVG = 'avg',
    COUNT = 'count',
    COUNT_DISTINCT = 'distinct',
    MAX = 'max',
    MIN = 'min',
}

export enum PinType {
    LEFT = 'left',
    NONE = 'none',
    RIGHT = 'right',
}

export enum MenuVerticalPosition {
    TOP = 'top',
    BOTTOM = 'bottom',
}

export enum MenuHorizontalPosition {
    LEFT = 'left',
    RIGHT = 'right',
}

export enum ToolbarPosition {
    TOP = 'top',
    BOTTOM = 'bottom',
}

export enum SideBarConfig {
    GRID = 'grid',
    PIVOT = 'pivot',
    FILTERS = 'filters',
    CHART = 'chart',
}

export enum BusActions {
    EXPAND = '@bg/expandAll',
    COLLAPSE = '@bg/collapseAll',
}

export enum FilterType {
    TEXT = 'text',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

export enum OperationType {
    NONE = 'none',
    EQUAL = 'eq',
    NOT_EQUAL = 'neq',
    GREATER_THAN = 'gt',
    GREATER_THAN_OR_EQUAL = 'gte',
    LESS_THAN = 'lt',
    LESS_THAN_OR_EQUAL = 'lte',
    BETWEEN = 'between',
}

export enum BeastMode {
    GRID = 'grid',
    CHART = 'chart',
}

export enum ChartType {
    BAR = 'bar',
    LINE = 'line',
    PIE = 'pie',
}

export enum ChangeType {
    SWAP = 'swap',
    PIVOT = 'pivot',
    SORT = 'sort',
    RESTORE = 'restore',
    PIN = 'pin',
    VISIBILITY = 'visibility'
}

export enum MathType {
    OPERATION = 'operation',
    CELL = 'cell',
}

export enum Operation {
    ADD = '+',
    SUBTRACT = '-',
    MULTIPLY = '*',
    DIVIDE = '/',
    POWER = '^',
}

export enum MathErrors {
    INVALID_FORMULA = 'Invalid formula',
    LESS_PRIORITY = 'Less priority',
    END_OF_FORMULA = 'End of formula',
}
