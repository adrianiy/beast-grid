'use client';

import numeral from 'numeral';
import { User, getData, months } from '../api/data';

import { AggregationType, BeastGrid, BeastGridApi, BeastGridConfig, ColumnDef } from 'beast-grid';
import { useEffect, useRef, useState } from 'react';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type Props = {
  qty: number;
  theme: string;
  config?: Partial<BeastGridConfig<User[]>>;
};
const columnDefs: ColumnDef[] = [
  {
    headerName: 'COUNTRY',
    field: 'country',
    width: 200,
    sortable: true,
    menu: {
      pin: true,
      filter: true,
      column: true
    },
  },
  {
    headerName: 'USER',
    children: [
      { headerName: 'NAME AND SURNAME', field: 'name', width: 200, sortable: true, menu: { grid: true, column: true } },
      { headerName: 'AGE', field: 'age', width: 100, sortable: true, menu: { grid: true } },
    ],
  },
  { headerName: 'USERS', field: 'id', aggregation: AggregationType.COUNT, flex: 1 },
  {
    headerName: 'MONTHS',
    children: [
      ...months.map(
        (month): ColumnDef => ({
          headerName: month.toUpperCase(),
          field: month,
          aggregation: AggregationType.SUM,
          sortable: true,
          flex: 1,
          formatter: (value: number) => numeral(value).format('0,0 $'),
        })
      ),
    ],
  },
];

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function Grid({ qty, theme, config: _customConfig }: Props) {
  const loading = useRef(false);
  const beastApi = useRef<BeastGridApi | undefined>();
  const [config, setConfig] = useState<BeastGridConfig<User[]> | undefined>();
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
        style: {
          maxHeight: 600,
          border: true
        },
        header: {
          border: true
        },
        row: {
          border: true,
          events: {
            onHover: {
              highlight: true
            }
          },
        },
        sort: {
          enabled: true,
          multiple: true
        },
        defaultColumnDef: {
          menu: { pin: true, grid: true },
        },
        ..._customConfig,
      });
    }
  }, [_customConfig, qty, theme, data]);

  const handleClose = () => {
    setError(false);
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={error}
        onClose={handleClose}
        TransitionComponent={SlideTransition as React.ComponentType<TransitionProps>}
        key={'copied'}
        autoHideDuration={1200}
      >
        <Alert onClose={handleClose} severity="error" variant="filled" sx={{ width: '100%' }}>
          Error fetching data :(
        </Alert>
      </Snackbar>
      <BeastGrid config={config} api={beastApi} theme={theme} />
    </>
  );
}
