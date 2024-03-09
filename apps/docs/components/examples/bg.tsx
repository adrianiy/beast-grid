import { BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';
import numeral from 'numeral';
import { User, data } from './data';
import 'beast-grid/style.css';

export default function BeastGridWrapper() {
  const columnDefs: ColumnDef[] = [
    { headerName: 'ID', field: 'userId', sortable: false, menu: { column: true } },
    { headerName: 'NAME', field: 'username', sortable: false },
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
    style: {
      border: true
    },
    sort: {
      enabled: true,
      multiple: true
    },
  };
  return (
    <BeastGrid config={config} injectStyles />,
  )
}
