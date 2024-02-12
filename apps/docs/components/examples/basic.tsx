import numeral from 'numeral';
import { BeastGrid, BeastGridConfig, ColumnDef } from 'beast-grid';


interface User {
    userId: number;
    username: string;
    money: number;
    orders: number;
}


export default function Grid() {
  const data: User[] = [
    { userId: 1, username: 'John Doe', money: 1000, orders: 10 },
    { userId: 2, username: 'Jane Doe', money: 2000, orders: 20 },
    { userId: 3, username: 'John Smith', money: 3000, orders: 30 },
    { userId: 4, username: 'Jane Smith', money: 4000, orders: 40 },
    { userId: 5, username: 'John Brown', money: 5000, orders: 50 },
    { userId: 6, username: 'Jane Brown', money: 6000, orders: 60 },
    { userId: 7, username: 'John White', money: 7000, orders: 70 },
    { userId: 8, username: 'Jane White', money: 8000, orders: 80 },
    { userId: 9, username: 'John Black', money: 9000, orders: 90 },
    { userId: 10, username: 'Jane Black', money: 10000, orders: 100 },
  ];

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
  const config: BeastGridConfig<User> = {
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
