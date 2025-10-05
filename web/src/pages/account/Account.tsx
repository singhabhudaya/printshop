// src/pages/account/Account.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";

export default function Account() {
  const { user, loading, setUser } = useAuth();
  const nav = useNavigate();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <h1 className="text-2xl font-semibold">You’re not logged in</h1>
        <div className="flex gap-2">
          <Link to="/auth/login" className="px-3 py-2 rounded border">Login</Link>
          <Link to="/auth/register" className="px-3 py-2 rounded bg-indigo-600 text-white">Create account</Link>
        </div>
      </div>
    );
  }

  const onLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    nav("/");
  };

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <div className="rounded-lg border p-4 space-y-2">
        <div><b>Name:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
        <div><b>Role:</b> {user.role}</div>
        {"sellerTier" in user && (user as any).sellerTier && (
          <div><b>Seller Tier:</b> {(user as any).sellerTier}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {user.role === "buyer" && (
          <Link to="/sellers/apply" className="px-3 py-2 rounded border">
            Become a seller
          </Link>
        )}

        {(user.role === "seller" || user.role === "admin") && (
          <Link to="/dashboard" className="px-3 py-2 rounded border">
            Go to dashboard
          </Link>
        )}

        <button onClick={onLogout} className="px-3 py-2 rounded bg-gray-200">
          Logout
        </button>
      </div>
    </div>
  );
}
