import { DragItem } from './../stores/dnd-store/store';
import { AggregationType, FilterType, PinType, SortType } from './enums';

export interface Row {
  [key: string]: unknown;
  id?: string;
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
  filterType?: FilterType;
  children?: ColumnDef[];
  formatter?: (value: string & number) => string;
  menu?: boolean | Partial<MenuProps>;
  aggregationLevel?: number;
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
  }>,
  onClick: Partial<{
    callback: (row: Row, idx: number) => void;
  }>
}
export interface RowConfig {
  height: number;
  border: boolean;
  events: Partial<RowEvents>;
}
export interface HeaderEvents {
  onDropOutside: Partial<{
    hide: boolean;
    callback: (column: Column) => void;
  }>
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

export interface BeastGridConfig<T> extends Partial<TableStyles> {
  columnDefs: ColumnDef[];
  defaultColumnDef?: Partial<ColumnDef>;
  data: T;
  sort?: Partial<SortConfig>;
  row?: Partial<RowConfig>;
  header?: Partial<HeaderConfig>;
  style?: Partial<StyleConfig>;
  dragOptions?: Partial<dragOptions>;
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
  childrenId?: ColumnId[];
  sort?: SortState;
  parent?: ColumnId;
  original?: ColumnId;
  originalParent?: ColumnId;
  logicDelete?: boolean;
  lastPinned?: boolean;
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
