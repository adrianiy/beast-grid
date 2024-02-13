export interface User {
  userId: number;
  username: string;
  country: string;
  totalOrders: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

export const getData = async (count: number): Promise<User[]> => {
  const response = await fetch(`/api/mock-data?count=${count}`);
  const data = await response.json();
  return data;
};
