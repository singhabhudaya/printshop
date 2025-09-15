
import axiosClient from "./axiosClient";
import { Order } from "../types";

export const orderApi = {
  create: async (payload: { productId: string; amount: number }) => {
    const { data } = await axiosClient.post<Order>("/orders/create", payload);
    return data;
  },
  assign: async (payload: { orderId: string; sellerId: string }) => {
    const { data } = await axiosClient.post<Order>("/orders/assign", payload);
    return data;
  },
  updateStatus: async (payload: { orderId: string; status: Order["status"] }) => {
    const { data } = await axiosClient.post<Order>("/orders/update-status", payload);
    return data;
  },
};
