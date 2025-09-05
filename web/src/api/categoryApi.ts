import axiosClient from "./axiosClient";
import type { Category } from "../types";

export const categoryApi = {
  list: async () => {
    const { data } = await axiosClient.get<Category[]>("/categories");
    return data;
  },
};

export default categoryApi;
