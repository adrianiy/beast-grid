import React from "react";

import { BeastGrid, ColumnDef, SortType } from "beast-grid";

export const data = [
    { userId: 1, username: "John Doe", money: 1000, orders: 10, product: "apple" },
    { userId: 2, username: "Jane Doe", money: 2000, orders: 20, product: "pear" },
    { userId: 3, username: "John Smith", money: 3000, orders: 30, product: "apple" },
    { userId: 4, username: "Jane Smith", money: 4000, orders: 40, product: "kiwi" },
    { userId: 5, username: "John Brown", money: 5000, orders: 50, product: "apple" },
    { userId: 6, username: "Jane Brown", money: 6000, orders: 60, product: "orange" },
    { userId: 7, username: "John White", money: 7000, orders: 70, product: "kiwi" },
    { userId: 8, username: "Jane White", money: 8000, orders: 80, product: "apple" },
    { userId: 9, username: "John Black", money: 9000, orders: 90, product: "pear" },
    { userId: 10, username: "Jane Black", money: 10000, orders: 100, product: "orange" },
];

const representationType = {
    value: "NUMBER",
    regex: "^(\\d+([.,]\\d+)?)$",
    expression: "$1€",
    __typename: "RepresentationType",
};

const regexp = representationType.regex;
const expression = representationType.expression;

export default function Grid() {
    const columnDefs: ColumnDef[] = [
        { headerName: "ID", field: "userId", sortable: false, flex: 1 },
        { headerName: "NAME", field: "username", sortable: false, flex: 1, sort: { order: SortType.DESC, priority: 1 } },
        {
            headerName: "AMOUNT",
            field: "money",
            flex: 1,
            formatter: (value: number) => value?.toString().replace(new RegExp(regexp), expression),
        },
        {
            headerName: "ORDERS",
            field: "orders",
            flex: 1,
            formatter: (value) => value,
            sort: { order: SortType.ASC, priority: 2 },
        },
        {
            headerName: "PRODUCT",
            field: "product",
            flex: 1,
            formatter: (value) => value,
        },
    ];

    const config = {
        data,
        columnDefs,
        appendModalToBoy: true,
        style: {
            border: true,
        },
        row: { border: true },
        pivot: {
            enabled: true,
            applyButton: true,
        },
        topToolbar: {
            grid: true,
            filter: true,
            mode: false,
            pivot: true,
            restore: true,
        },
        sort: {
            enabled: true,
            multiple: true,
        },
    };

    return (
        <div style={{ height: 400 }}>
            <BeastGrid config={config} />
        </div>
    );
}
