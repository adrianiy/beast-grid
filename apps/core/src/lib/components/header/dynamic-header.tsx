import { useEffect, useState } from "react";
import { useBeastStore } from "../../stores/beast-store";
import { groupBy } from "../../utils/functions";
import { Column, MIN_COL_WIDTH, PinType } from "../../common";
import { v4 as uuidv4 } from 'uuid';

export default function DynamicHeader() {
  const [pivot, data] = useBeastStore((state) => [state.pivot, state.data]);
  const [columnDefs, setColumnDefs] = useState<Column[]>([]);

  useEffect(() => {
    if (pivot?.columns) {
      pivot?.columns.forEach(column => {
        const groupedData = groupBy(data, column, []);
        const values = groupedData.map((row) => row[column.field as string]);

        // convert values to columnDefs

        const columns: Column[] = values.map((value, idx) => {
          return {
            id: uuidv4(),
            position: idx,
            idx,
            level: 0,
            final: true,
            headerName: `${value}`,
            field: `${value}`,
            width: MIN_COL_WIDTH,
            pinned: PinType.NONE,
            finalPosition: idx,
            top: 0,
            left: idx * MIN_COL_WIDTH
          };
        });

        setColumnDefs(columns);
      });
    }
    
    
  }, [pivot?.columns, data])

  if (!pivot?.enabled) {
    return null;
  }

  console.log(columnDefs)
  
  return (
    <div>
      <h1>Dynamic Header</h1>
    </div>
  )
}
