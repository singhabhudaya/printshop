
import axiosClient from "./axiosClient";
import { Product } from "../types";

export const productApi = {
  list: async (params?: { categoryId?: string }) => {
    const { data } = await axiosClient.get<Product[]>("/products", { params });
    return data;
  },
  featured: async () => {
    const { data } = await axiosClient.get<{ trending: Product[]; bestSellers: Product[]; newArrivals: Product[] }>("/products/featured");
    return data;
  },
  detail: async (id: string) => {
    const { data } = await axiosClient.get<Product>(`/products/${id}`);
    return data;
  },
};
