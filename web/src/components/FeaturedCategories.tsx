// src/components/FeaturedCategories.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { categoryApi } from "../api/categoryApi";
import { Category } from "../types";
import { ImageIcon } from "lucide-react";

// Extend the app's Category type locally (non-breaking)
type UICategory = Category & { slug: string; image?: string };

// ---- Fallback list (type-safe) ----
const FALLBACK: UICategory[] = [
  { id: "phone-cases",       name: "Phone Cases",       slug: "phone-cases",       image: "/categories/phone-cases.png" },
  { id: "phone-accessories", name: "Phone Accessories", slug: "phone-accessories", image: "/categories/phone-accessories.png" },
  { id: "phone-stands",      name: "Phone Stands",      slug: "phone-stands",      image: "/categories/phone-stands.png" },
  { id: "keychains",         name: "Keychains",         slug: "keychains",         image: "/categories/keychains.png" },
  { id: "functional-toys",   name: "Functional Toys",   slug: "functional-toys",   image: "/categories/functional-toys.png" },
  { id: "smart-products",    name: "Smart Products",    slug: "smart-products",    image: "/categories/smart-products.png" },
  { id: "cool-gadgets",      name: "Cool Gadgets",      slug: "cool-gadgets",      image: "/categories/cool-gadgets.png" },
  { id: "dioramas",          name: "Dioramas",          slug: "dioramas",          image: "/categories/dioramas.png" },
  { id: "everyday-products", name: "Everyday Products", slug: "everyday-products", image: "/categories/everyday-products.png" },
  { id: "gifts-for-him",     name: "Gifts for Him",     slug: "gifts-for-him",     image: "/categories/gifts-for-him.png" },
  { id: "gifts-for-her",     name: "Gifts for Her",     slug: "gifts-for-her",     image: "/categories/gifts-for-her.png" },
  { id: "accessories",       name: "Accessories",       slug: "accessories",       image: "/categories/accessories.png" },
  { id: "custom",            name: "Custom Jobs",       slug: "custom",            image: "/categories/custom.png" },
];

// Type guard to safely coerce API results to UICategory[]
function isUICategory(x: any): x is UICategory {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    typeof x.slug === "string"
  );
}

const cardVariants: Variants = {
  hover: {
    scale: 1.05,
    y: -5,
    boxShadow:
      "0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { type: "spring", stiffness: 300, damping: 20 } as const,
  },
};

// A single category card
const CategoryCard = ({ category }: { category: UICategory }) => (
  <Link to={`/category/${encodeURIComponent(category.slug)}`}>
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="group relative flex flex-col items-center justify-center text-center rounded-2xl overflow-hidden border border-gray-200 bg-white h-full p-4 transition-shadow shadow-sm hover:shadow-lg"
    >
      <div className="flex-grow flex items-center justify-center w-full">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <ImageIcon size={48} />
          </div>
        )}
      </div>
      <div className="w-full mt-4">
        <h3 className="text-sm font-semibold text-gray-800">{category.name}</h3>
      </div>
    </motion.div>
  </Link>
);

// Skeleton while loading
const SkeletonCard = () => (
  <div className="bg-gray-100 rounded-2xl h-48 animate-pulse p-4 flex flex-col items-center justify-center">
    <div className="w-24 h-24 bg-gray-200 rounded-full" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mt-4" />
  </div>
);

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchCategories = async () => {
      try {
        const data = await categoryApi.list();

        if (!alive) return;

        if (Array.isArray(data)) {
          const safe = data.filter(isUICategory);
          setCategories(safe.length ? safe : FALLBACK);
        } else {
          setCategories(FALLBACK);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        if (alive) setCategories(FALLBACK);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    fetchCategories();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="featured-categories" className="bg-gray-50/70">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Explore our curated collections of 3D printed wonders.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            : categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </div>
    </section>
  );
}
