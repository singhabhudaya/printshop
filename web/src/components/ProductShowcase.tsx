// Your existing file, now simplified: src/components/ProductShowcase.tsx
import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import { Product } from "../types";
import Row from './ProductRow'; // Or wherever you saved it

// Initial empty state to prevent checking for `data.trending`, etc. on first render
const initialState = {
  trending: [],
  bestSellers: [],
  newArrivals: [],
};

export default function ProductShowcase() {
  const [data, setData] = useState<{ trending: Product[]; bestSellers: Product[]; newArrivals: Product[] }>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        const featuredData = await productApi.featured();
        if (isMounted && featuredData) {
          setData(featuredData);
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchFeatured();

    return () => { isMounted = false };
  }, []);
  
  const showContent = !loading && (data.trending.length > 0 || data.bestSellers.length > 0 || data.newArrivals.length > 0);

  return (
    <section id="product-showcase" className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Fresh Off the Press
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Discover what's new, what's hot, and what our community is loving right now.
            </p>
        </div>
        {loading && (
          <>
            <Row title="Trending" items={[]} isLoading />
            <Row title="Best Sellers" items={[]} isLoading />
          </>
        )}
        {showContent && (
          <>
            {data.trending.length > 0 && <Row title="Trending" items={data.trending} />}
            {data.bestSellers.length > 0 && <Row title="Best Sellers" items={data.bestSellers} />}
            {data.newArrivals.length > 0 && <Row title="New Arrivals" items={data.newArrivals} />}
          </>
        )}
      </div>
    </section>
  );
}