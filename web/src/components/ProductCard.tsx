// This could be a new file: src/components/ProductCard.tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Product } from "../types"; // Assuming your type is here

// Helper function for currency formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const ProductCard = ({ product }: { product: Product }) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating when clicking the button
    e.stopPropagation();
    console.log(`Added ${product.title} to cart!`);
    // Here you would dispatch an action to your global state (Zustand, Redux, etc.)
  };

  return (
    <Link to={`/product/${product.id}`} className="block w-[240px] flex-shrink-0">
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-full flex flex-col transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={product.images?.[0] || "/placeholder.png"}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <button 
            onClick={handleAddToCart}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/70 backdrop-blur-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Add to cart"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">
            {product.title}
          </h3>
          <p className="mt-2 text-indigo-600 font-bold text-lg">
            {formatPrice(product.price)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

export const ProductCardSkeleton = () => (
    <div className="w-[240px] flex-shrink-0 p-2">
      <div className="rounded-xl border border-gray-200 bg-white h-full animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
);