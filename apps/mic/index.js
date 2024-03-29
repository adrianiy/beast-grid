const express = require('express');
const { faker } = require('@faker-js/faker');
const dayjs = require('dayjs');

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
  return {
    id,
    date: dayjs(faker.date.recent()).format('YYYY-MM-DD'),
    country: faker.location.country(),
    language: faker.lorem.word(),
    orders: faker.number.int({ min: 0, max: 100000 }),
    units: faker.number.int({ min: 0, max: 100000 }),
  };
}

const createData = (count) => {
  return Array.from({ length: count }, (_,idx) => createRandomUser(idx));
};

const createDateData = (count) => {
  return [
    { id: 0, date: '2021-01-01', country: 'USA', language: 'English', orders: 100, units: 1000 },
    { id: 1, date: '2021-01-01', country: 'Spain', language: 'Spanish', orders: 200, units: 2000 },
    { id: 1, date: '2021-01-02', country: 'USA', language: 'English', orders: 200, units: 2000 },
    { id: 1, date: '2021-01-02', country: 'Spain', language: 'Spanish', orders: 200, units: 2000},
    { id: 2, date: '2021-01-03', country: 'USA', language: 'English', orders: 300, units: 3000 },
    { id: 2, date: '2021-01-03', country: 'Spain', language: 'Spanish', orders: 300, units: 3000 },
    { id: 3, date: '2021-01-04', country: 'USA', language: 'English', orders: 400, units: 4000 },
  ]
  return Array.from({ length: count }, (_,idx) => createRandomDate(idx));
};

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
  const data = createDateData(req.query.count || 25);

  res.json(data);
})

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
