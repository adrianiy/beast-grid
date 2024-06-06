'use client';

import numeral from 'numeral';
import { User, getData, months } from '../api/data';

import { AggregationType, BeastGrid, BeastGridApi, BeastGridConfig, ColumnDef, Data, Row } from 'beast-grid';
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
            column: true,
        },
    },
    {
        headerName: 'USER',
        children: [
            {
                headerName: 'NAME AND SURNAME',
                field: 'name',
                width: 200,
                sortable: true,
                menu: { grid: true, column: true },
            },
            {
                headerName: 'AGE',
                field: 'age',
                width: 200,
                sortable: true,
                aggregation: AggregationType.AVG,
                menu: { grid: true, filter: true },
            },
            { headerName: 'LANGUAGE', field: 'language', width: 200, menu: { grid: true, column: true } },
        ],
    },
    {
        headerName: 'USERS',
        field: 'id',
        aggregation: (row: Row) => row.children?.length || 0,
        flex: 1,
        formatter: (value: number, row: Row) => `${value}${row.children?.length ? ' users' : ''}`,
    },
    {
        headerName: 'MONTHS',
        children: [
            ...months.map(
                (month): ColumnDef => ({
                    headerName: month.toUpperCase(),
                    field: month,
                    menu: {
                        filter: true,
                    },
                    styleFormatter: (value) => {
                        if (+value < 10000) {
                            return { color: 'red' };
                        }
                        return {};
                    },
                    aggregation: AggregationType.SUM,
                    sortable: true,
                    flex: 1,
                    formatter: (value) => numeral(value).format('0,0 $'),
                })
            ),
        ],
    },
];

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

function Skeleton() {
    return <div>Loading...</div>;
}

export default function Grid({ qty, theme, config: _customConfig }: Props) {
    const loading = useRef(false);
    const beastApi = useRef<BeastGridApi | undefined>();
    const [config, setConfig] = useState<BeastGridConfig<User[]> | undefined>();
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getData(qty);
                beastApi?.current?.setData(res as unknown as Data);
            } catch (_) {
                setError(true);
            }
        };
        if (!loading.current) {
            loading.current = true;
            fetchData();
        }
    }, [qty]);

    useEffect(() => {
        setConfig({
            data: [],
            columnDefs,
            style: {
                maxHeight: 600,
                border: true,
            },
            loadingState: {
                skeleton: <Skeleton />,
                rows: 15,
            },
            header: {
                border: true,
            },
            row: {
                border: true,
                events: {
                    onClick: {
                        callback: () => console.log('test'),
                    },
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
            chart: {
                defaultValues: {
                    dataColumns: ['january', 'february'],
                },
                groupData: false,
            },
            contextualMenu: {
                chart: true,
            },
            bottomToolbar: {
                downloadExcel: true,
                restore: true,
            },
            defaultColumnDef: {
                menu: { pin: true, grid: true },
            },
            pivot: {
                enabled: true,
                applyButton: true,
            },
            appendModalToBoy: true,
            ..._customConfig,
        });
    }, [_customConfig, qty, theme]);

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
