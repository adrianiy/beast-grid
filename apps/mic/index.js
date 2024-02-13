const express = require('express');
const { faker } = require('@faker-js/faker');

const app = express();

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
}

app.get('/api/mock-data', (req, res) => {
  const data = createData(req.query.count || 25);
  
  res.json(createData(req.query.count || 25));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

