// /web/src/components/FeaturedCategories.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { categoryApi } from "../api/categoryApi";
import type { Category } from "../types";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

/** ---------------- Types ---------------- */
type UIImage = { src: string; alt?: string };
type UICategory = Category & {
  // Derived UI fields
  slug: string;           // Shopify handle-ish
  images?: UIImage[];     // optional if you later add multiple images/category
};

/** ---------------- ENV / Config ----------------
 * Set this in /web/.env (Vite):
 *   VITE_SHOPIFY_STORE_URL="https://yourstore.myshopify.com"  // or https://shop.yourdomain.com
 * We build links like: `${VITE_SHOPIFY_STORE_URL}/collections/<handle>`
 */
const SHOPIFY_BASE =
  (import.meta as any).env?.VITE_SHOPIFY_STORE_URL?.replace(/\/$/, "") ||
  "https://printingmuse.myshopify.com/"; // TODO: set real store domain

/** If any category slug/handle differs in Shopify, override it here */
const SHOPIFY_HANDLE_OVERRIDES: Record<string, string> = {
  // "gifts-for-him": "gifts-him-2025",
  // "phone-accessories": "accessories-phone",
};

/** ---------------- Helpers ---------------- */
function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function isCategory(x: unknown): x is Category {
  const y = x as Partial<Category>;
  return !!y && typeof y === "object" && typeof y.id === "string" && typeof y.name === "string";
}

function toUICategory(c: Category): UICategory {
  // Prefer id (your ids already look handle-like in your fallback),
  // else derive from name.
  const baseSlug = c.id?.trim() ? toSlug(c.id) : toSlug(c.name);
  return { ...c, slug: baseSlug };
}

function shopifyCollectionUrl(slugOrName: string): string {
  const slug = toSlug(slugOrName);
  const handle = SHOPIFY_HANDLE_OVERRIDES[slug] ?? slug;
  return `${SHOPIFY_BASE}/collections/${encodeURIComponent(handle)}`;
}

/** Make a list of images to render per category.
 * If you only have a single `image`, we duplicate it so the rail still scrolls.
 */
function toImages(cat: UICategory): UIImage[] {
  if (Array.isArray(cat.images) && cat.images.length) {
    return cat.images.filter((im): im is UIImage => !!im?.src);
  }
  if (cat.image) {
    const base = { src: cat.image, alt: cat.name };
    return [0, 1, 2, 3].map((i) => ({ ...base, src: `${base.src}?v=${i}` }));
  }
  return [];
}

/** ---------------- Motion ---------------- */
const tileVariants: Variants = {
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

/** ---------------- Fallback (non-breaking) ---------------- */
const FALLBACK_BASE: Array<Omit<UICategory, "images">> = [
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

/** ---------------- One category rail ---------------- */
function CategoryRail({ category }: { category: UICategory }) {
  const images = useMemo(() => toImages(category), [category]);
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  const href = shopifyCollectionUrl(category.slug || category.name);

  return (
    <section className="mb-8 sm:mb-10" aria-label={`${category.name} carousel`}>
      <div className="px-4 sm:px-0 flex items-baseline justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{category.name}</h3>

        {/* External Shopify link (not <Link/>) */}
        <a
          href={href}
          className="text-sm text-blue-600 hover:text-blue-700"
          aria-label={`Open ${category.name} on Shopify`}
        >
          View all
        </a>
      </div>

      <div className="relative mt-3 group">
        {/* desktop nav buttons */}
        <button
          onClick={() => scrollByAmount("left")}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/5 hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={() => scrollByAmount("right")}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/5 hover:bg-white"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>

        {/* horizontal rail */}
        <div
          ref={railRef}
          className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-p-4 px-4 -mx-4 pb-2
            [scrollbar-width:none] [-ms-overflow-style:none]
          "
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {/* Hide scrollbar (WebKit) */}
          <style>{`.snap-x::-webkit-scrollbar{ display:none }`}</style>

          {images.length ? (
            images.map((img, idx) => (
              <a
                href={href}
                key={idx}
                className="
                  relative shrink-0 snap-center
                  rounded-2xl overflow-hidden
                  min-w-[85vw] h-[52vw] max-w-[520px] max-h-[360px]
                  bg-gray-100
                "
                aria-label={`Open ${category.name} on Shopify`}
              >
                <motion.div variants={tileVariants} whileHover="hover" className="w-full h-full">
                  <img
                    src={img.src}
                    alt={img.alt ?? category.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transform-gpu transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/25" />
                </motion.div>
              </a>
            ))
          ) : (
            <a
              href={href}
              className="
                relative shrink-0 snap-center
                rounded-2xl overflow-hidden
                min-w-[85vw] h-[52vw] max-w-[520px] max-h-[360px]
                bg-gray-50 border border-gray-200 flex items-center justify-center
                text-gray-400
              "
              aria-label={`Open ${category.name} on Shopify`}
            >
              <ImageIcon className="w-14 h-14" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/** ---------------- Skeletons ---------------- */
function SkeletonRail() {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="px-4 sm:px-0">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
      </div>
      <div className="flex gap-4 overflow-hidden px-4 -mx-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 min-w-[85vw] h-[52vw] max-w-[520px] max-h-[360px] rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}

/** ---------------- Main (landing page section) ---------------- */
export default function FeaturedCategories() {
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoryApi.list();
        if (!alive) return;

        if (Array.isArray(data)) {
          // Validate & coerce -> UICategory with derived slug
          const safe = data.filter(isCategory).map(toUICategory);
          setCategories(safe.length ? safe : (FALLBACK_BASE as UICategory[]));
        } else {
          setCategories(FALLBACK_BASE as UICategory[]);
        }
      } catch (e) {
        console.error("Failed to fetch categories:", e);
        if (alive) setCategories(FALLBACK_BASE as UICategory[]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="featured-categories" className="bg-gray-50/70">
      <div className="max-w-6xl mx-auto px-0 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="px-4 sm:px-0 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured Categories
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Swipe through gorgeous picks in each category. Tap to open.
          </p>
        </div>

        <div className="mt-10">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRail key={i} />)
            : categories.map((cat) => <CategoryRail key={cat.id} category={cat} />)}
        </div>
      </div>
    </section>
  );
}
