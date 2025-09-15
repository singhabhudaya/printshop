
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { authApi } from "../api/authApi";

interface Ctx { user: User | null; setUser: (u: User | null) => void; loading: boolean; }
const Ctx = createContext<Ctx>({ user: null, setUser: () => {}, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    authApi.me().then((u) => setUser(u)).catch(()=>{}).finally(() => setLoading(false));
  }, []);
  return <Ctx.Provider value={{ user, setUser, loading }}>{children}</Ctx.Provider>;
};
export const useAuth = () => useContext(Ctx);
