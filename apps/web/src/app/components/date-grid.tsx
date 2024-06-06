'use client';

import numeral from 'numeral';
import { User, getItxData } from '../api/data';

import { BeastGrid, BeastGridApi, BeastGridConfig, ColumnDef } from 'beast-grid';
import { useEffect, useRef, useState } from 'react';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type Props = {
    qty: number;
    theme: string;
    config?: Partial<BeastGridConfig<User[]>>;
};
// const columnDefs: ColumnDef[] = [
//     {
//         headerName: 'DATE',
//         field: 'date',
//         width: 200,
//         sortable: true,
//         menu: {
//             pin: true,
//             filter: true,
//             column: true,
//         },
//     },
//     { headerName: 'WEEK', field: 'week', width: 200, sortable: true, menu: { grid: true, column: true } },
//     { headerName: 'COUNTRY', field: 'country', width: 200, sortable: true, menu: { grid: true, column: true } },
//     { headerName: 'LANGUAGE', field: 'language', width: 200, sortable: true, menu: { grid: true, column: true } },
//     {
//         headerName: 'ORDERS',
//         field: 'orders',
//         width: 200,
//         sortable: true,
//         menu: { grid: true, column: true },
//         aggregation: AggregationType.SUM,
//         flex: 1,
//     },
//     {
//         headerName: 'UNITS',
//         field: 'units',
//         width: 200,
//         sortable: true,
//         menu: { grid: true, column: true },
//         aggregation: AggregationType.SUM,
//         formatter: (value) => numeral(value).format('0,0'),
//         flex: 1,
//     },
// ];

const columnDefs: ColumnDef[] = [
    'DATE',
    'MARKET',
    'SECTION',
    'PRODUCT',
    'FAMILY',
    'SUBFAMILY',
    'VB_ORDERS',
    'VB.GENERAL.SAME_DATE_COMMERCIAL_DAY_A1_ORDERS',
    'VB_SHIPMENTS',
    'VB.GENERAL.SAME_DATE_COMMERCIAL_DAY_A1_AMOUNT IN EUROS',
    'VB_AMOUNT IN EUROS',
    'VB.GENERAL.SAME_DATE_COMMERCIAL_DAY_A1_SHIPMENTS',
    'VB.GENERAL.SAME_DATE_COMMERCIAL_DAY_A1_UNITS',
    'VB_UNITS',
].map((field) => {
    return {
        headerName: field,
        field,
        width: 200,
        sortable: true,
        formatter: (value) => field.startsWith('VB') ? numeral(value).format('0,0 $') : value,
        menu: {
            filter: field === 'VB_ORDERS',
            column: true
        }
    };
});

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

export default function DateGrid({ qty, theme, config: _customConfig }: Props) {
    const loading = useRef(false);
    const beastApi = useRef<BeastGridApi | undefined>();
    const [config, setConfig] = useState<BeastGridConfig<User[]> | undefined>();
    const [data, setData] = useState<User[]>([]);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getItxData();
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
                pivot: {
                    enabled: true,
                },
                style: {
                    maxHeight: 600,
                    border: true,
                },
                header: {
                    border: true,
                },
                row: {
                    border: true,
                    events: {
                        onHover: {
                            highlight: true,
                        },
                    },
                },
                sort: {
                    enabled: true,
                    multiple: true,
                },
                topToolbar: {
                    mode: true,
                    grid: true,
                    pivot: true,
                    filter: true,
                },
                bottomToolbar: {
                    downloadExcel: true,
                    restore: true,
                },
                contextualMenu: {
                    chart: true,
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
            <BeastGrid config={config} api={beastApi} theme={theme} locale="es" />
        </>
    );
}
