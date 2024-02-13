'use client';

import numeral from 'numeral';
import { TableData, User } from '../api/data';

import { BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';
import { useEffect, useState } from 'react';

type Props = {
  count: number;
  theme: string;
  config?: Partial<BeastGridConfig<User>>;
};
const columnDefs: ColumnDef[] = [
  { headerName: 'ID', field: 'userId' },
  { headerName: 'NAME', field: 'username', width: 300 },
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

export default function Grid({ count, theme, config: _customConfig }: Props) {
  const [config, setConfig] = useState<BeastGridConfig<User> | null>();

  useEffect(() => {
    const data = [...TableData(count)];
    console.log(data.length)
    setConfig({
      data,
      columnDefs,
      border: true,
      mulitSort: true,
      theme,
      ..._customConfig,
    });
  }, []);


  return  <BeastGrid config={config} />;
}
