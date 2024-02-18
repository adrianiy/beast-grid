'use client'
import 'beast-grid/style.css'

import numeral from 'numeral';
import { BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';
import { User, data } from './data';

export default function Grid() {

  const columnDefs: ColumnDef[] = [
    { headerName: 'ID', field: 'userId' },
    { headerName: 'NAME', field: 'username' },
    {
      headerName: 'AMOUNT',
      field: 'money',
      flex: 1,
      formatter: (value) => numeral(value).format('0,0 $'),
    },
    {
      headerName: 'ORDERS',
      field: 'orders',
      flex: 1,
      formatter: (value) => numeral(value).format('0,0'),
    },
  ];
  const config: BeastGridConfig<User[]> = {
    data,
    columnDefs,
    border: true,
    mulitSort: true,
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <BeastGrid config={config} />
    </div>
  );
}
