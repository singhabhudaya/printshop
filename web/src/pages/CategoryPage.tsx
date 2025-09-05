
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi } from "../api/productApi";
import { Product } from "../types";

export default function CategoryPage() {
  const { id } = useParams();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.list({ categoryId: id }).then(setItems).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 capitalize">{id}</h1>
      {loading ? "Loading..." : (
        <div className="grid md:grid-cols-3 gap-4">
          {items.map(p => (
            <Link to={`/product/${p.id}`} key={p.id} className="border rounded-xl overflow-hidden">
              <div className="aspect-square bg-gray-100">
                <img src={p.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="font-medium line-clamp-1">{p.title}</div>
                <div className="text-indigo-600 font-semibold mt-1">₹ {p.price.toFixed(0)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
