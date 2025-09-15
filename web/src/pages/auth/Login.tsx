
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../state/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await authApi.login({ email, password });
      setUser(user);
      nav("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
    }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border rounded-lg px-3 py-2" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white">Login</button>
      </form>
    </div>
  );
}
