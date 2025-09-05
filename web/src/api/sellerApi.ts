
import axiosClient from "./axiosClient";
import { Order, User } from "../types";

export const sellerApi = {
  register: async (payload: { sellerTier: 1 | 2 }) => {
    const { data } = await axiosClient.post<User>("/sellers/register", payload);
    return data;
  },
  dashboard: async () => {
    const { data } = await axiosClient.get<{ orders: Order[]; earnings: number }>("/sellers/dashboard");
    return data;
  },
};
