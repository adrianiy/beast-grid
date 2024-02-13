'use client';

import numeral from 'numeral';
import { User, getData } from '../api/data';

import {
  BeastGrid,
  BeastGridApi,
  BeastGridConfig,
  ColumnDef,
} from 'beast-grid';
import { useEffect, useRef, useState } from 'react';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type Props = {
  qty: number;
  theme: string;
  config?: Partial<BeastGridConfig<User>>;
};
const columnDefs: ColumnDef[] = [
  { headerName: 'ID', field: 'id' },
  { headerName: 'NAME', field: 'name', width: 200 },
  { headerName: 'COUNTRY', field: 'country', width: 200 },
  {
    headerName: 'JANUARY',
    field: 'january',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'FEBRUARY',
    field: 'february',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'MARCH',
    field: 'march',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'APRIL',
    field: 'april',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'MAY',
    field: 'may',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'JUNE',
    field: 'june',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'JULY',
    field: 'july',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'AUGUST',
    field: 'august',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'SEPTEMBER',
    field: 'september',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'OCTOBER',
    field: 'october',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'NOVEMBER',
    field: 'november',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
  {
    headerName: 'DECEMBER',
    field: 'december',
    flex: 1,
    formatter: (value) => numeral(value).format('0,0 $'),
  },
];

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function Grid({ qty, theme, config: _customConfig }: Props) {
  const loading = useRef(false);
  const beastApi = useRef<BeastGridApi | undefined>();
  const [config, setConfig] = useState<BeastGridConfig<User> | null>();
  const [data, setData] = useState<User[]>([]);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getData(qty - data.length);
        setData((state) => [...state, ...res]);
        loading.current = false;
        beastApi?.current?.setLoading(false);
      } catch (_) {
        setError(true);
        beastApi?.current?.setLoading(false);
      }
    };
    if (!loading.current) {
      loading.current = true;
      beastApi?.current?.setLoading(true);
      fetchData();
    }
  }, [qty]);

  useEffect(() => {
    if (data.length) {
      setConfig({
        data,
        columnDefs,
        border: true,
        mulitSort: true,
        theme,
        ..._customConfig,
      });
    }
  }, [_customConfig, qty, theme, data]);

  const handleClose = () => {
    setError(false);
  };

  if (!config) return null;

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={error}
        onClose={handleClose}
        TransitionComponent={
          SlideTransition as React.ComponentType<TransitionProps>
        }
        key={'copied'}
        autoHideDuration={1200}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Error fetching data :(
        </Alert>
      </Snackbar>
      <BeastGrid config={config} api={beastApi} />
    </>
  );
}
