// /web/src/components/FeaturedCategories.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

/** ---------- Types (UI) ---------- */
type UIImage = { src: string; alt?: string };
type UIProduct = {
  id: string;
  name: string;
  image?: string;
  handle?: string;
  price: number;
  compareAtPrice?: number;
};
type UICategory = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  __products?: UIProduct[];
};

/** ---------- ENV ---------- */
const RAW_BASE =
  (import.meta as any).env?.VITE_SHOPIFY_STORE_URL || "https://printingmuse.myshopify.com";
const SHOPIFY_BASE = String(RAW_BASE).replace(/\/$/, "");
const STOREFRONT_TOKEN = (import.meta as any).env?.VITE_SHOPIFY_STOREFRONT_TOKEN || "";
const USING_SHOPIFY = !!STOREFRONT_TOKEN;

/** ---------- Dynamic settings ---------- */
const MAX_COLLECTIONS = 8; // how many collections to show
const EXCLUDE_HANDLES = new Set<string>([
  "frontpage", // Shopify's default collection
]);

/** ---------- Helpers ---------- */
const toSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
function shopifyCollectionUrl(slugOrName: string) {
  const slug = toSlug(slugOrName);
  return `${SHOPIFY_BASE}/collections/${encodeURIComponent(slug)}`;
}
function toImages(cat: UICategory): UIImage[] {
  if (cat.image) {
    const base = { src: cat.image, alt: cat.name };
    return [0, 1, 2, 3].map((i) => ({ ...base, src: `${base.src}?v=${i}` }));
  }
  return [];
}

/** ---------- Motion ---------- */
const tileVariants: Variants = {
  hover: { scale: 1.03, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

/** ---------- Minimal Storefront client ---------- */
const SHOPIFY_GRAPHQL = USING_SHOPIFY
  ? `${SHOPIFY_BASE.replace(/^https?:\/\//, "https://")}/api/2024-07/graphql.json`
  : "";

async function shopifyGql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(SHOPIFY_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: any) => e.message).join("; "));
  return json.data as T;
}

/** ---------- GraphQL result types ---------- */
type CollectionsOnlyResp = {
  collections: {
    edges: Array<{
      node: { id: string; title: string; handle: string; image?: { url?: string | null } | null };
    }>;
  };
};

type ProductEdge = { cursor: string; node: any };
type CollectionProductsResp = {
  collectionByHandle: null | {
    products: {
      edges: ProductEdge[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
};

// helper for the non-null branch of collectionByHandle
type ProductsBlock = NonNullable<CollectionProductsResp["collectionByHandle"]>["products"];

/** ---------- Collections + ALL products (paginated) ---------- */

// 1) fetch only the collections (fast)
async function fetchCollectionsOnly(limitCollections: number) {
  const q = /* GraphQL */ `
    query Collections($first: Int!) {
      collections(first: $first, sortKey: UPDATED_AT) {
        edges { node { id title handle image { url altText } } }
      }
    }
  `;
  const data = await shopifyGql<CollectionsOnlyResp>(q, { first: limitCollections });
  return data.collections.edges.map((e) => e.node);
}

// 2) fetch *all* products for one collection via cursor pagination
async function fetchAllProductsForCollection(handle: string, pageSize = 250) {
  const q = /* GraphQL */ `
    query CollectionProducts($handle: String!, $first: Int!, $cursor: String) {
      collectionByHandle(handle: $handle) {
        products(first: $first, after: $cursor) {
          edges {
            cursor
            node {
              id
              handle
              title
              featuredImage { url altText }
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `;

  const products: any[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const resp: CollectionProductsResp = await shopifyGql<CollectionProductsResp>(q, {
      handle,
      first: pageSize,
      cursor,
    });

    const list: ProductsBlock | undefined = resp.collectionByHandle?.products;
    if (!list) break;

    products.push(...list.edges.map((e: ProductEdge) => e.node));
    hasNext = list.pageInfo.hasNextPage;
    cursor = list.pageInfo.endCursor;
  }
  return products;
}

function toUIProductFromShopify(node: any): UIProduct {
  const price = Number(node?.priceRange?.minVariantPrice?.amount ?? 0);
  const compareAt = Number(node?.compareAtPriceRange?.minVariantPrice?.amount ?? 0) || undefined;
  return {
    id: node.id,
    name: node.title,
    image: node.featuredImage?.url ?? undefined,
    handle: node.handle,
    price,
    compareAtPrice: compareAt,
  };
}

/** ---------- Product Card ---------- */
function ProductCard({ p }: { p: UIProduct }) {
  const onSale = !!(p.compareAtPrice && p.compareAtPrice > p.price);
  const href = p.handle ? `${SHOPIFY_BASE}/products/${encodeURIComponent(p.handle)}` : `/product/${p.id}`;
  return (
    <a
      className="group rounded-2xl bg-white/70 hover:bg-white transition shadow-sm hover:shadow-md border border-black/5 overflow-hidden"
      href={href}
    >
      {/* Keep a pleasant portrait ratio; the width is controlled by the parent container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          loading="lazy"
          src={p.image ?? "/placeholder.png"}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
        />
        {onSale && (
          <span className="absolute left-3 bottom-3 px-2 py-1 text-xs rounded-full bg-black/80 text-white">
            Sale
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs sm:text-sm font-medium line-clamp-2">{p.name}</div>
        <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-sm sm:text-base">
            ₹ {Number(p.price ?? 0).toLocaleString("en-IN")}
          </span>
          {onSale && (
            <span className="text-xs sm:text-sm text-black/50 line-through">
              ₹ {Number(p.compareAtPrice ?? 0).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

/** ---------- Fallback tile (if a collection has 0 products) ---------- */
function OldCarouselFallback({ category }: { category: UICategory }) {
  const images = useMemo(() => toImages(category), [category]);
  const href = shopifyCollectionUrl(category.slug || category.name);
  if (!images.length) {
    return (
      <a
        href={href}
        className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 h-64"
      >
        <ImageIcon className="w-14 h-14" />
      </a>
    );
  }
  return (
    <a
      href={href}
      className="relative rounded-2xl overflow-hidden bg-gray-100 h-64 shadow-sm border border-black/5"
    >
      <motion.div variants={tileVariants} whileHover="hover" className="w-full h-full">
        <img
          src={images[0].src}
          alt={images[0].alt ?? category.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/25" />
      </motion.div>
    </a>
  );
}

/** ---------- Category section (grid ≤3, swipe >3) ---------- */
function CategoryWithProducts({ category }: { category: UICategory }) {
  const items = category.__products ?? [];
  const collectionHref = shopifyCollectionUrl(category.slug || category.name);

  // swipe rail when more than 3
  const railRef = useRef<HTMLDivElement | null>(null);
  const scrollByAmount = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  const moreThanThree = items.length > 3;

  return (
    <section className="mb-8 sm:mb-10" aria-label={`${category.name} products`}>
      <div className="px-4 sm:px-0 flex items-baseline justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{category.name}</h3>
        <a href={collectionHref} className="text-sm text-blue-600 hover:text-blue-700">
          View all
        </a>
      </div>

      {/* <= 3: wider grid on mobile; > 3: horizontal swipe with wide tiles on mobile */}
      {!moreThanThree ? (
        /* ⬇️ 2-up on mobile (wider cards), 3-up on md+ */
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-0">
          {items.length > 0 ? (
            items.map((p) => <ProductCard key={p.id} p={p} />)
          ) : (
            <OldCarouselFallback category={category} />
          )}
        </div>
      ) : (
        <div className="relative mt-4 group">
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

          <div
            ref={railRef}
            className="
              flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 -mx-4 pb-1
              [scrollbar-width:none] [-ms-overflow-style:none]
            "
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {/* hide webkit scrollbar */}
            <style>{`.snap-x::-webkit-scrollbar{ display:none }`}</style>

            {items.map((p) => (
              <div
                key={p.id}
                className="
                  snap-start flex-none
                  w-[80%] sm:w-[45%] md:w-[33.333%]
                  max-w-[420px]
                "
              >
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** ---------- Main ---------- */
export default function FeaturedCategories() {
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (USING_SHOPIFY) {
          // 1) load latest collections
          const collections = await fetchCollectionsOnly(MAX_COLLECTIONS);
          const filtered = collections.filter((c: any) => !EXCLUDE_HANDLES.has(c.handle));

          // 2) fetch ALL products for each collection, with gentle concurrency
          const chunks = (arr: any[], size: number) =>
            arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), [] as any[][]);

          const ui: UICategory[] = [];
          for (const group of chunks(filtered, 3)) {
            // 3 collections at a time
            const results = await Promise.allSettled(
              group.map((c: { handle: string }) => fetchAllProductsForCollection(c.handle))
            );
            results.forEach((r, i) => {
              const c = group[i];
              const nodes = r.status === "fulfilled" ? r.value : [];
              ui.push({
                id: c.id,
                name: c.title,
                slug: c.handle,
                image: c.image?.url ?? undefined,
                __products: nodes.map(toUIProductFromShopify),
              });
            });
          }

          if (alive) setCategories(ui);
        } else {
          if (alive) setCategories([]);
        }
      } catch (e) {
        console.error("FeaturedCategories load error:", e);
        if (alive) setCategories([]);
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
            Discover top picks in each category. Tap a product to view.
          </p>
        </div>

        <div className="mt-10">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <section key={i} className="mb-8 sm:mb-10">
                  <div className="px-4 sm:px-0">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
                  </div>
                  {/* ⬇️ skeleton matches 2-up mobile / 3-up md+ */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-0">
                    {[...Array(6)].map((_, k) => (
                      <div
                        key={k}
                        className="h-64 rounded-2xl bg-gray-100 animate-pulse border border-black/5"
                      />
                    ))}
                  </div>
                </section>
              ))
            : categories.map((cat) => <CategoryWithProducts key={cat.id} category={cat} />)}
        </div>
      </div>
    </section>
  );
}
