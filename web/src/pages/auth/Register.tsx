
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../state/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer"|"seller">((params.get("seller") === "1") ? "seller" : "buyer");
  const [tier, setTier] = useState<1|2>(1);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name, email, password, role };
      if (role === "seller") payload.sellerTier = tier;
      const { user } = await authApi.register(payload);
      setUser(user);
      nav("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full border rounded-lg px-3 py-2" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border rounded-lg px-3 py-2" />
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2"><input type="radio" checked={role==="buyer"} onChange={()=>setRole("buyer")} /> Buyer</label>
          <label className="flex items-center gap-2"><input type="radio" checked={role==="seller"} onChange={()=>setRole("seller")} /> Seller</label>
        </div>
        {role==="seller" && (
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2"><input type="radio" checked={tier===1} onChange={()=>setTier(1)} /> Tier 1 (List products)</label>
            <label className="flex items-center gap-2"><input type="radio" checked={tier===2} onChange={()=>setTier(2)} /> Tier 2 (Job board)</label>
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white">Register</button>
      </form>
    </div>
  );
}
