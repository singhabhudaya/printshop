
import axiosClient from "./axiosClient";
import { User } from "../types";

export const authApi = {
  register: async (payload: { name: string; email: string; password: string; role?: "buyer" | "seller"; sellerTier?: 1 | 2; }) => {
    const { data } = await axiosClient.post<{ token: string; user: User }>("/auth/register", payload);
    localStorage.setItem("token", data.token);
    return data;
  },
  login: async (payload: { email: string; password: string }) => {
    const { data } = await axiosClient.post<{ token: string; user: User }>("/auth/login", payload);
    localStorage.setItem("token", data.token);
    return data;
  },
  me: async () => {
    const { data } = await axiosClient.get<User>("/auth/me");
    return data;
  },
  logout: () => localStorage.removeItem("token"),
};
