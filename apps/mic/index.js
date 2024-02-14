const express = require('express');
const { faker } = require('@faker-js/faker');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function createRandomUser() {
  return {
    id: faker.string.uuid(),
    name: faker.internet.userName(),
    country: faker.location.country(),
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

const createData = (count) => {
  return Array.from({ length: count }, () => createRandomUser());
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
