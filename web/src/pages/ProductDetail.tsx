
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import { orderApi } from "../api/orderApi";
import { Product } from "../types";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) productApi.detail(id).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-8">Not found</div>;

  const buy = async () => {
    await orderApi.create({ productId: product.id, amount: product.price });
    alert("Order created! (Payment flow is stubbed for MVP)");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="rounded-2xl border overflow-hidden">
        <img src={product.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="text-indigo-600 text-2xl font-bold mt-2">₹ {product.price.toFixed(0)}</div>
        <button onClick={buy} className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white">Buy Now</button>
        {product.stlFile && (<a href={product.stlFile} target="_blank" className="ml-3 text-sm underline">Download STL</a>)}
      </div>
    </div>
  );
}
