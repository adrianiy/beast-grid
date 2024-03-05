'use client'

import 'beast-grid/style.css'

import numeral from 'numeral';
import { AggregationType, BeastGrid, BeastGridConfig, ColumnDef, PinType } from 'beast-grid';
import { User, dataToGroup } from './data';

export default function Grid() {

  const columnDefs: ColumnDef[] = [
    {
      headerName: 'USER', children: [
        { headerName: 'COUNTRY', field: 'country', sortable: false, aggregationLevel: 1 },
        { headerName: 'NAME', field: 'username', sortable: false },

      ],
      pinned: PinType.LEFT 
    },
    {
      headerName: 'AMOUNT',
      field: 'money',
      aggregation: AggregationType.SUM,
      flex: 1,
      formatter: (value) => numeral(value).format('0,0 $'),
    },
    {
      headerName: 'UNITS',
      field: 'money',
      aggregation: AggregationType.SUM,
      flex: 1,
      formatter: (value) => numeral(value).format('0,0 $'),
    },
    {
      headerName: 'ORDERS',
      field: 'orders',
      aggregation: AggregationType.SUM,
      flex: 1,
      formatter: (value) => numeral(value).format('0,0'),
    },
  ];
  const config: BeastGridConfig<User[]> = {
    data: dataToGroup,
    columnDefs,
    border: true,
    sort: {
      enabled: true
    }
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <BeastGrid config={config} />
    </div>
  );
}
