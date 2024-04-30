import { Column } from 'beast-grid';

export interface User {
  userId: number;
  username: string;
  country: string;
  totalOrders: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

export const getData = async (count: number): Promise<User[]> => {
  const response = await fetch(`/api/mock-data?count=${count}`);
  const data = await response.json();
  return data;
};

export const getDateData = async (count: number): Promise<User[]> => {
  const response = await fetch(`/api/mock-date?count=${count}`);
  const data = await response.json();
  return data;
};

export const getItxData = async (): Promise<any> => {
    const response = await fetch('/api/mock-itx');
    const data = await response.json();
    return data;
}

export const sortData = async (data: User[], columns: Column[]) => {
  const response = await fetch('/api/sort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data, columns }),
  });
  const sortedData = await response.json();
  return sortedData;
};

export const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export const codeBlock = `
import numeral from 'numeral';

import { User, data, months } from '../api/data';

const columnDefs: ColumnDef[] = [
  { headerName: 'COUNTRY', field: 'country', width: 200, filterType: FilterType.STRING, menu: true, aggregationLevel: 1 },
  { headerName: 'USERS', field: 'id', aggregation: AggregationType.COUNT, flex: 1 },
  { headerName: 'NAME', field: 'name', width: 200, menu: { column: true, grid: true } },
  { headerName: 'AGE', field: 'age', width: 100, menu: true },
  ...months.map((month): ColumnDef => ({
    headerName: month.toUpperCase(),
    field: month,
    aggregation: AggregationType.SUM,
    flex: 1,
    formatter: (value: number) => numeral(value).format('0,0 $')
  })),
];

export default function Grid() {
  const beastApi = useRef<BeastGridApi | undefined>();

  const config: BeastGridConfig<User> = {
    columnDefs,
    data,
    sortable: true,
    mulitSort: true,
    summarize: true,
    defaultColumnDef: {
      menu: { column: true, grid: true },
    },
  };

  return (
    <BeastGrid config={config} api={beastApi} />
  );
`;
