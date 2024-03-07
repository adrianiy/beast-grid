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
  RIGHT = 'right',
}

export enum SideBarConfig {
  GRID = 'grid',
  FILTERS = 'filters'
}

export enum BusActions {
  EXPAND = '@bg/expandAll',
  COLLAPSE = '@bg/collapseAll',
  SHOW_MENU = '@bg/showMenu',
  HIDE_MENU = '@bg/hideMenu',
}
