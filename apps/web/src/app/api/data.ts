import { faker } from '@faker-js/faker';

export interface User {
    userId: number;
    username: string;
    money: number;
    orders: number;
}

const names = faker.helpers.multiple(faker.person.fullName, { count: 100 });


export function createRandomUser(idx: number): User {
    return {
        userId: Math.round(Math.random() * 100000),
        username: names[idx % 100],
        money: faker.number.int({ min: 0, max: 100000 }),
        orders: faker.number.int({ min: 0, max: 100000 }),
    };
}
export const TableData = (count: number) => {
    return Array.from({ length: count }, (_, i) => createRandomUser(i));
}
