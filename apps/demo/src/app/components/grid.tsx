'use client';

import numeral from 'numeral';
import { TableData, User } from '../api/data';

import { BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';


type Props = {
  count: number;
  theme: string;
  config?: Partial<BeastGridConfig<User>>;
}

export default function Grid({ count, theme, config: _customConfig }: Props) {
  const data = TableData(count);

  const columnDefs: ColumnDef[] = [
    { headerName: 'ID', field: 'userId' },
    { headerName: 'NAME', field: 'username' },
    { headerName: 'MAIL', field: 'email', width: 300 },
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
  const config: BeastGridConfig<User> = {
    data,
    columnDefs,
    border: true,
    mulitSort: true,
    theme,
    ..._customConfig,
  };

  return (
      <BeastGrid config={config} />
  );
}
