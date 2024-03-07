import { DragItem } from './../stores/dnd-store/store';
import { AggregationType, PinType, SortType, ToolbarPosition } from './enums';

export interface Row {
  [key: string]: unknown;
  _id?: string;
  _orignalIdx?: number;
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

export type IFilter = string | number | boolean;

export interface BaseColumnDef {
  headerName: string;
  pinned?: PinType;
  field?: string;
  sortable?: boolean;
  children?: ColumnDef[];
  formatter?: (value: string & number) => string;
  menu?: Partial<MenuProps>;
  rowGroup?: boolean;
  aggregation?: AggregationType;
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
export interface dragOptions {
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

export interface ToolBar {
  download: boolean;
  grid: boolean;
  filter: boolean;
  chart: boolean;
  position: ToolbarPosition
}

export interface BeastGridConfig<T> extends Partial<TableStyles> {
  columnDefs: ColumnDef[];
  defaultColumnDef?: Partial<ColumnDef>;
  data: T;
  sort?: Partial<SortConfig>;
  row?: Partial<RowConfig>;
  header?: Partial<HeaderConfig>;
  style?: Partial<StyleConfig>;
  dragOptions?: Partial<dragOptions>;
  tree?: Partial<TreeConstructor>;
  toolbar?: Partial<ToolBar>;
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
  childrenId?: ColumnId[];
  sort?: SortState;
  parent?: ColumnId;
  original?: ColumnId;
  originalParent?: ColumnId;
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
