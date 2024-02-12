import { faker } from '@faker-js/faker';

export interface User {
    userId: string;
    username: string;
    email: string;
    money: number;
    orders: number;
}

export function createRandomUser(): User {
    return {
        userId: faker.string.uuid(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        money: faker.number.int({ min: 0, max: 100000 }),
        orders: faker.number.int({ min: 0, max: 100000 }),
    };
}
export const TableData = (count: number) => faker.helpers.multiple(createRandomUser, {
    count,
});
