const express = require('express');
const { faker } = require('@faker-js/faker');
const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');

dayjs.extend(weekOfYear);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function createRandomUser(id) {
    return {
        id,
        name: faker.internet.userName(),
        country: faker.location.country(),
        language: faker.lorem.word(),
        age: faker.number.int({ min: 18, max: 100 }),
        orders: faker.number.int({ min: 0, max: 100000 }),
        january: faker.number.int({ min: 0, max: 100000 }),
        february: faker.number.int({ min: 0, max: 100000 }),
        march: faker.number.int({ min: 0, max: 100000 }),
        april: faker.number.int({ min: 0, max: 100000 }),
        may: faker.number.int({ min: 0, max: 100000 }),
        june: faker.number.int({ min: 0, max: 100000 }),
        july: faker.number.int({ min: 0, max: 100000 }),
        august: faker.number.int({ min: 0, max: 100000 }),
        september: faker.number.int({ min: 0, max: 100000 }),
        october: faker.number.int({ min: 0, max: 100000 }),
        november: faker.number.int({ min: 0, max: 100000 }),
        december: faker.number.int({ min: 0, max: 100000 }),
    };
}

function createRandomDate(id) {
    const day = dayjs('2021-01-01').add(id, 'day');
    return {
        id,
        date: day.format('YYYY-MM-DD'),
        week: day.week(),
        country: faker.location.country(),
        language: faker.lorem.word(),
        orders: faker.number.int({ min: 0, max: 100000 }),
        units: faker.number.int({ min: 0, max: 100000 }),
    };
}

const createData = (count) => {
    return Array.from({ length: count }, (_, idx) => createRandomUser(idx));
};

const createDateData = (count) => {
    // return [
    //   { id: 0, date: '2021-01-01', week: 1, country: 'USA', language: 'English', orders: 100, units: 1000 },
    //   { id: 1, date: '2021-01-02', week: 1, country: 'Spain', language: 'Spanish', orders: 200, units: 2000 },
    //   { id: 1, date: '2021-01-02', week: 1, country: 'USA', language: 'Spanish', orders: 200, units: 2000 },
    //   { id: 1, date: '2021-01-12', week: 2,  country: 'USA', language: 'English', orders: 200, units: 2000 },
    //   { id: 1, date: '2021-01-12', week: 2, country: 'Spain', language: 'Spanish', orders: 200, units: 2000},
    //   { id: 2, date: '2021-01-23', week: 3, country: 'USA', language: 'English', orders: 300, units: 3000 },
    //   { id: 2, date: '2021-01-23', week: 3, country: 'Spain', language: 'Spanish', orders: 300, units: 3000 },
    //   { id: 3, date: '2021-01-24', week: 3, country: 'USA', language: 'English', orders: 400, units: 4000 },
    // ]
    return Array.from({ length: count }, (_, idx) => createRandomDate(idx));
};

const dateData = createDateData(600000);

const sortData = (sortColumns) => (a, b) => {
    for (const column of sortColumns) {
        const valueA = a[column.field];
        const valueB = b[column.field];

        if (valueA > valueB) {
            return column.sort.order === 'asc' ? 1 : -1;
        }
        if (valueA < valueB) {
            return column.sort.order === 'desc' ? -1 : 1;
        }
    }
    return 0;
};

app.get('/api/mock-data', (req, res) => {
    const data = createData(req.query.count || 25);

    res.json(data);
});

app.get('/api/mock-date', (req, res) => {

    res.json(dateData);
});

app.post('/api/sort', (req, res) => {
    const body = req.body;
    const data = body.data;
    const sortColumns = body.columns;

    const sortedData = data.sort(sortData(sortColumns));

    res.json(sortedData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
