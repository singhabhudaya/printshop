
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function Orders() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { axiosClient.get("/admin/orders").then(({data}) => setRows(data)).catch(()=>{}); }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin — Orders</h1>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">Product</th>
              <th className="text-left p-2 border-b">Buyer</th>
              <th className="text-left p-2 border-b">Seller</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.id}</td>
                <td className="p-2 border-b">{r.productId}</td>
                <td className="p-2 border-b">{r.buyerId}</td>
                <td className="p-2 border-b">{r.sellerId ?? "-"}</td>
                <td className="p-2 border-b">{r.status}</td>
                <td className="p-2 border-b">₹ {r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
