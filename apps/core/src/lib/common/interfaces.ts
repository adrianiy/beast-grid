import { DragItem } from './../stores/dnd-store/store';
import { FilterType, SortType } from './enums';

export type Row = Record<string, string | number | unknown>;

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
  field: string;
  sortable?: boolean;
  filterType?: FilterType;
  children?: ColumnDef[];
  formatter?: (value: string & number) => string;
  menu?: boolean | Partial<MenuProps>;
}

export type ColumnDef = Partial<StyleProps> & Partial<FilterProps> & BaseColumnDef;

export interface BeastGridConfig<T> extends Partial<TableStyles> {
  columnDefs: ColumnDef[];
  defaultColumnDef?: Partial<ColumnDef>;
  data: T;
  sortable?: boolean;
  mulitSort?: boolean;
  summarize?: boolean;
  dragOptions?: Partial<{
    autoScrollSpeed: number;
    autoScrollMargin: number;
  }>
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

export interface SortConfig {
  order: SortType;
  priority: number;
}

export interface Column extends ColumnDef, Position {
  id: ColumnId;
  position: number;
  level: number;
  final: boolean;
  width: number;
  sort?: SortConfig;
  parent?: ColumnId;
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
