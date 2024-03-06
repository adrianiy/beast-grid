'use client'

import 'beast-grid/style.css'

import numeral from 'numeral';
import { AggregationType, BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';
import { User, dataToGroup } from './data';

export default function Grid() {

  const columnDefs: ColumnDef[] = [
    { headerName: 'COUNTRY', field: 'country', sortable: false, aggregationLevel: 1 },
    { headerName: 'NAME', field: 'username', sortable: false },
    { headerName: 'LANGUAGE', field: 'language', aggregationLevel: 2 },
    {
      headerName: 'AMOUNT',
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
    },
    row: {
      groups: {
        showChildName: true
      }
    }
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <BeastGrid config={config} />
    </div>
  );
}