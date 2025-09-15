
import { useEffect, useState } from "react";
import { sellerApi } from "../../api/sellerApi";

export default function Tier2Dashboard() {
  const [data, setData] = useState<{ orders: any[]; earnings: number } | null>(null);
  useEffect(() => { sellerApi.dashboard().then(setData).catch(()=>{}); }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Seller Tier 2 — Job Board</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4">
          <div className="font-medium">Earnings</div>
          <div className="text-2xl mt-2">₹ {data?.earnings ?? 0}</div>
        </div>
        <div className="md:col-span-2 border rounded-xl p-4">
          <div className="font-medium mb-2">Assigned Orders</div>
          <ul className="space-y-2 text-sm">
            {(data?.orders ?? []).map((o) => (
              <li key={o.id} className="border rounded-lg p-2 flex justify-between">
                <span>{o.id.slice(0,8)} — {o.status}</span>
                <span>₹ {o.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
