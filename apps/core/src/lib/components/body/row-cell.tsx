import { Column } from "./../../common/interfaces";

function getProperty<Type, Key extends keyof Type>(obj: Type, columnDef: Column): string {
  const value = obj[columnDef.field as Key];

  if (columnDef.formatter) {
    return columnDef.formatter(value as number & string);
  }

  return value as string;
}

export function RowCell<TData>({ height, row, columnDef }: { height: number, row: TData, columnDef: Column }) {
  if (columnDef.hidden) {
    return null;
  }
  return (
    <div className="grid-row-cell" style={{ height, left: columnDef.left, width: columnDef.width }}>
      { getProperty(row, columnDef) }
    </div>
  )
}
