import { DragItem } from './../stores/dnd-store/store';
import { SortType } from './enums';

export interface StyleProps {
  width: number;
  minWidth: number;
  maxWidth: number;
  hidden: boolean;
  flex: number;
}

export type ColumnId = string;

export interface BaseColumnDef {
  headerName: string;
  field: string;
  children?: ColumnDef[];
  formatter?: (value: unknown) => string;
}

export type ColumnDef = Partial<StyleProps> & BaseColumnDef;

export interface BeastGridConfig<TData> extends Partial<TableStyles> {
  columnDefs: ColumnDef[];
  defaultColumnDef?: ColumnDef;
  data: TData[];
  theme?: string;
  mulitSort?: boolean;
  summarize?: boolean;
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

