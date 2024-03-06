export interface User {
    userId?: number;
    country?: string;
    language?: string;
    username: string;
    money: number;
    orders: number;
}

export const data: User[] = [
  { userId: 1, username: 'John Doe', money: 1000, orders: 10 },
  { userId: 2, username: 'Jane Doe', money: 2000, orders: 20 },
  { userId: 3, username: 'John Smith', money: 3000, orders: 30 },
  { userId: 4, username: 'Jane Smith', money: 4000, orders: 40 },
  { userId: 5, username: 'John Brown', money: 5000, orders: 50 },
  { userId: 6, username: 'Jane Brown', money: 6000, orders: 60 },
  { userId: 7, username: 'John White', money: 7000, orders: 70 },
  { userId: 8, username: 'Jane White', money: 8000, orders: 80 },
  { userId: 9, username: 'John Black', money: 9000, orders: 90 },
  { userId: 10, username: 'Jane Black', money: 10000, orders: 100 },
];

export const dataToGroup: User[] = [
  { country: 'USA', username: 'John Doe', language: 'English', money: 1000, orders: 10 },
  { country: 'USA', username: 'Jane Doe', language: 'Engish', money: 2000, orders: 20 },
  { country: 'USA', username: 'John Smith', language: 'Spanish', money: 3000, orders: 30 },
  { country: 'Spain', username: 'Jane Smith', language: 'Spanish', money: 4000, orders: 40 },
  { country: 'Spain', username: 'John Brown', language: 'Spanish', money: 5000, orders: 50 },
  { country: 'Spain', username: 'Jane Brown', language: 'French', money: 6000, orders: 60 },
  { country: 'Spain', username: 'John White', language: 'French', money: 7000, orders: 70 },
  { country: 'Italy', username: 'Jane White', language: 'Italian', money: 8000, orders: 80 },
  { country: 'Italy', username: 'John Black', language: 'Spanish', money: 9000, orders: 90 },
  { country: 'Italy', username: 'Jane Black', language: 'Spanish', money: 10000, orders: 100 },
  { country: 'Japan', username: 'Jane Black', language: 'Spanish', money: 10000, orders: 100 },
  { country: 'Japan', username: 'Jane Black', language: 'Japanese', money: 10000, orders: 100 },
  { country: 'Japan', username: 'Jane White', language: 'Korean', money: 10000, orders: 100 },
]


