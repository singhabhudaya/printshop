
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function Sellers() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { axiosClient.get("/admin/sellers").then(({data}) => setRows(data)).catch(()=>{}); }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin — Sellers</h1>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">Name</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Tier</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.id}</td>
                <td className="p-2 border-b">{r.name}</td>
                <td className="p-2 border-b">{r.email}</td>
                <td className="p-2 border-b">{r.sellerTier ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
