'use client';

import numeral from 'numeral';
import { User, getData, months } from '../api/data';

import { AggregationType, BeastGrid, BeastGridApi, BeastGridConfig, ChangeType, ColumnDef, Data, PinType, Row, SortType } from 'beast-grid';
import { useEffect, useRef, useState } from 'react';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Changes } from 'beast-grid';

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
        headerStyleFormatter: () => ({ backgroundColor: 'red' }),
        sort: {
            order: SortType.DESC,
            priority: 1
        },
        menu: {
            pin: true,
            filter: true,
            column: true,
        },
    },
    {
        headerName: 'BOOLEAN',
        field: 'es_activo',
        width: 200,
        sortable: true,
        headerStyleFormatter: () => ({ backgroundColor: 'blue' }),
        sort: {
            order: SortType.DESC,
            priority: 1
        },
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
    // {
    //     headerName: 'USERS',
    //     field: 'id',
    //     aggregation: (row: Row) => row.children?.length || 0,
    //     flex: 1,
    //     formatter: (value: number, row: Row) => `${value}${row.children?.length ? ' users' : ''}`,
    // },
    // {
    //     headerName: '1ST_QUARTER',
    //     field: '#{january + february + march + april}',
    //     flex: 1,
    //     formatter: (value) => numeral(value).format('0,0 $'),
    // },
    // {
    //     headerName: 'Image test',
    //     field: 'image_test',
    //     pinned: PinType.LEFT,
    //     hideInDownload: true,
    //     flex: 1,
    // },
    // {
    //     headerName: 'MONTHS',
    //     children: [
    //         ...months.map(
    //             (month): ColumnDef => ({
    //                 headerName: month.toUpperCase(),
    //                 field: month,
    //                 menu: {
    //                     filter: true,
    //                 },
    //                 styleFormatter: (value) => {
    //                     if (+value < 10000) {
    //                         return { color: 'red' };
    //                     }
    //                     return {};
    //                 },
    //                 sortable: true,
    //                 flex: 1,
    //                 formatter: (value) => numeral(value).format('0,0 $'),
    //             })
    //         ),
    //     ],
    // },
];

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

function Skeleton() {
    return <div className="skeleton"></div>;
}

function Test() {
    return <span>texto de prueba</span>
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
                setTimeout(() => {
                    beastApi?.current?.setData(res.map((r, i) => ({ ...r, es_activo: i % 2 === 0, image_test: <img src="https://static.zara.net/photos/2024/I/0/1/p/4360/246/832/5/w/400/4360246832_1_1_1.jpg?ts=1727440558880" width="50" alt="test" /> })));
                }, 5000)
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
            fullWidth: true,
            style: {
                maxHeight: 'calc(100vh - 100px)',
                border: true,
            },
            loadingState: {
                skeleton: <Skeleton />,
                rows: 5,
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
            topLeftToolbar: {
                history: true,
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
                downloadExcel: {
                    enabled: true,
                    active: true
                },
                restore: {
                    enabled: true,
                    active: true
                },
                custom: <div>Toggle</div>
            },
            defaultColumnDef: {
                menu: { pin: true, grid: false },
            },
            pivot: {
                enabled: true,
                applyButton: true,
                totalizable: true
            },
            appendModalToBoy: true,
            ..._customConfig,
        });
    }, [_customConfig, qty, theme]);

    const handleClose = () => {
        setError(false);
    };

    const handleChanges = (changeType: ChangeType, config: Changes) => {
        if (changeType === ChangeType.VISIBILITY) {
            console.log(config)
        }
    }

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
            <BeastGrid title={<span>Title</span>} config={config} api={beastApi} theme={theme} locale="es" onChanges={handleChanges} />
        </>
    );
}
