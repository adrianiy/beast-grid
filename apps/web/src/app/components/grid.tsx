'use client';

import numeral from 'numeral';
import { User, getData, months } from '../api/data';

import {
  BeastGrid,
  BeastGridApi,
  BeastGridConfig,
  ColumnDef,
  FilterType,
} from 'beast-grid';
import { useEffect, useRef, useState } from 'react';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type Props = {
  qty: number;
  theme: string;
  config?: Partial<BeastGridConfig<User[]>>;
};
const columnDefs: ColumnDef[] = [
  { headerName: 'ID', field: 'id', sortable: false },
  { headerName: 'NAME', field: 'name', width: 200, menu: { column: true, grid: true } },
  { headerName: 'COUNTRY', field: 'country', width: 200, filterType: FilterType.STRING, menu: true },
  ...months.map((month) => ({
    headerName: month.toUpperCase(),
    field: month,
    flex: 1,
    formatter: (value: number) => numeral(value).format('0,0 $')
  })),
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
        border: true,
        mulitSort: true,
        summarize: true,
        defaultColumnDef: {
          menu: { column: true, grid: true },
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
      <BeastGrid config={config} api={beastApi} theme={theme}/>
    </>
  );
}
