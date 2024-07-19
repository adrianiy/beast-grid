'use client';

import numeral from 'numeral';
import { User, getData, months } from '../api/data';

import { AggregationType, BeastGrid, BeastGridApi, BeastGridConfig, Changes, ColumnDef, Data, Row, SortType, ChangeType } from 'beast-grid';
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
    {
        headerName: 'USERS',
        field: 'id',
        aggregation: (row: Row) => row.children?.length || 0,
        flex: 1,
        formatter: (value: number, row: Row) => `${value}${row.children?.length ? ' users' : ''}`,
    },
    {
        headerName: '1ST_QUARTER',
        field: '#{january + february + march + april}',
        flex: 1,
        formatter: (value) => numeral(value).format('0,0 $'),
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
            topRows: [
                {
                    _total: true,
                    id: 9,
                    name: 'Xzavier_Casper86',
                    country: <span style={{ color: 'red' }}>Spain</span>,
                    language: 'paulatim',
                    age: 66,
                    orders: 69415,
                    january: 79684,
                    february: 96576,
                    march: 96082,
                    april: 13873,
                    may: 39414,
                    june: 70879,
                    july: 64054,
                    august: 33908,
                    september: 44870,
                    october: 47387,
                    november: 17569,
                    december: 41062,
                },
            ],
            columnDefs,
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
                    active: false
                },
                restore: {
                    enabled: true,
                    active: true
                },
            },
            defaultColumnDef: {
                menu: { pin: true, grid: false },
            },
            pivot: {
                enabled: true,
                applyButton: true,
                // pivotConfig: {
                //     rows: ['country'],
                //     columns: ['language'],
                //     values: [
                //         { field: 'january', operation: AggregationType.SUM },
                //         { field: 'february', operation: AggregationType.SUM },
                //     ],
                //     rowTotals: false,
                //     columnTotals: false,
                //     rowGroups: false
                // }
            },
            appendModalToBoy: true,
            ..._customConfig,
        });
    }, [_customConfig, qty, theme]);

    const handleClose = () => {
        setError(false);
    };

    const handleChanges = (changeType: ChangeType, config: Changes) => {
        if (changeType === ChangeType.SORT) {
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
            <BeastGrid config={config} api={beastApi} theme={theme} locale="es" onChanges={handleChanges} />
        </>
    );
}
