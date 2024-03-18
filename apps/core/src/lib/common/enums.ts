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
  PIE = 'pie'
}
