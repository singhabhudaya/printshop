// web/src/api/authApi.ts
import axiosClient from "./axiosClient";
import type { User } from "../types";

type AuthResponse = { token: string; user: User };
type MeResponse = { user: User };

export const authApi = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: "buyer" | "seller";
    sellerTier?: 1 | 2;
  }): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/register", payload);
    localStorage.setItem("token", data.token);
    return data; // { token, user }
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/login", payload);
    localStorage.setItem("token", data.token);
    return data; // { token, user }
  },

  async me(): Promise<User> {
    const { data } = await axiosClient.get<MeResponse>("/auth/me");
    return data.user; // <-- AuthContext expects the user object
  },

  logout(): void {
    localStorage.removeItem("token");
  },
};
