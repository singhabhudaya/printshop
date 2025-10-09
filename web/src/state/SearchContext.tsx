import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import {
  searchProducts,
  searchCollections,
  fetchSuggestionTitles,
  fetchFeaturedProducts,
  ShopifyCollectionLite,
  ShopifyProductLite,
} from "../api/shopify";

// Preferred storefront base if set
const SHOP_BASE = (import.meta as any).env.VITE_SHOP_ORIGIN as string | undefined;
// Fallback: normalize VITE_SHOPIFY_STORE_URL -> https://domain
const RAW_STORE = (import.meta as any).env.VITE_SHOPIFY_STORE_URL as string | undefined;
const STORE_BASE = RAW_STORE
  ? (RAW_STORE.startsWith("http") ? RAW_STORE : `https://${RAW_STORE}`).replace(/\/+$/, "")
  : undefined;

function shopLink(path: string): string | null {
  const base = (SHOP_BASE ? SHOP_BASE.replace(/\/+$/, "") : undefined) || STORE_BASE;
  return base ? `${base}${path}` : null;
}

export type SearchItem =
  | { type: "page"; id: string; title: string; subtitle?: string; url: string; image?: string | null }
  | { type: "collection"; id: string; title: string; url: string; image?: string | null; handle: string }
  | { type: "product"; id: string; title: string; url: string; image?: string | null; handle: string; vendor?: string | null; tags?: string[] | null };

type Ctx = {
  open: boolean;
  setOpen(v: boolean): void;
  loading: boolean;
  results: SearchItem[];        // mixed list — component will group by type
  suggestion: string | null;    // “Did you mean …”
  query: string;
  setQuery(v: string): void;
};

const SearchCtx = createContext<Ctx | null>(null);

// We keep pages searchable (refund, shipping, etc.) but don’t show them in empty state.
const staticPages: SearchItem[] = [
  { type: "page", id: "shipping", title: "Shipping & Delivery", url: "/shippingdelivery" },
  { type: "page", id: "refunds", title: "Cancellation & Refund", url: "/cancellationrefund" },
  { type: "page", id: "privacy", title: "Privacy Policy", url: "/privacypolicy" },
  { type: "page", id: "terms", title: "Terms & Conditions", url: "/termsandconditions" },
  { type: "page", id: "contact", title: "Contact Us", url: "/contactus" },
];

const COLLECTION_SUGGESTIONS = [
  { handle: "toys", title: "Toys" },
  { handle: "gadgets", title: "Gadgets" },
  { handle: "cosplay", title: "Cosplay" },
  { handle: "decor", title: "Decor" },
  { handle: "gifts", title: "Gifts" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function productToItem(p: ShopifyProductLite): SearchItem {
  const external = shopLink(`/products/${p.handle}`);
  const url = external ?? `/product/${p.handle ?? p.id}`; // absolute shop link when possible
  return {
    type: "product",
    id: p.id,
    title: p.title,
    url,
    image: p.featuredImage?.url ?? null,
    handle: p.handle,
    vendor: p.vendor ?? null,
    tags: p.tags ?? null,
  };
}

function collectionToItem(c: ShopifyCollectionLite): SearchItem {
  const external = shopLink(`/collections/${c.handle}`);
  const url = external ?? `/category/${c.handle ?? c.id}`;
  return {
    type: "collection",
    id: c.id,
    title: c.title,
    url,
    image: c.image?.url ?? null,
    handle: c.handle,
  };
}

function collectionItemFromHandle(h: { handle: string; title: string }): SearchItem {
  const external = shopLink(`/collections/${h.handle}`);
  const url = external ?? `/category/${h.handle}`;
  return { type: "collection", id: h.handle, title: h.title, url, handle: h.handle };
}

function levenshtein(a: string, b: string) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const dp = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // For empty state
  const [seed, setSeed] = useState<SearchItem[]>([]);

  const fuse = useMemo(() => {
    return new Fuse(staticPages, {
      includeScore: true,
      threshold: 0.35,
      keys: ["title"],
    });
  }, []);

  // Lazy title corpus for “Did you mean …”
  const titlesCorpusRef = useRef<string[] | null>(null);
  const loadedCorpusRef = useRef(false);

  // When opening, prep empty-state content + corpus
  useEffect(() => {
    let cancelled = false;
    async function seedEmpty() {
      if (!open) return;
      const cats = shuffle(COLLECTION_SUGGESTIONS).slice(0, 5).map(collectionItemFromHandle);
      const featured = await fetchFeaturedProducts(16).catch(() => []);
      const picks = shuffle(featured).slice(0, 6).map(productToItem);
      if (!cancelled) setSeed([...cats, ...picks]);
    }
    seedEmpty();

    if (open && !loadedCorpusRef.current) {
      loadedCorpusRef.current = true;
      fetchSuggestionTitles(120).then(t => (titlesCorpusRef.current = t ?? [])).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [open]);

  // Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault(); setOpen(true);
      }
      if (open && e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Main search
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = query.trim();
      if (!term) {
        setResults(seed.length ? seed : []);
        setSuggestion(null);
        return;
      }
      setLoading(true);

      const localMatches = fuse.search(term).slice(0, 3).map(r => r.item);
      const [prods, cols] = await Promise.all([
        searchProducts(term, 10).catch(() => []),
        searchCollections(term, 6).catch(() => []),
      ]);

      if (cancelled) return;

      const items: SearchItem[] = [
        ...prods.map(productToItem),
        ...cols.map(collectionToItem),
        ...localMatches, // pages after commerce
      ];

      // Did you mean …
      let sugg: string | null = null;
      const titles = titlesCorpusRef.current ?? [];
      if (titles.length && term.length >= 3) {
        let best: { title: string; dist: number } | null = null;
        for (const t of titles) {
          const d = levenshtein(term, t);
          if (!best || d < best.dist) best = { title: t, dist: d };
        }
        if (best && best.dist > 0 && best.dist <= Math.max(2, Math.floor(term.length * 0.25))) {
          const alreadyThere = items.some(i => i.title.toLowerCase() === best!.title.toLowerCase());
          sugg = alreadyThere ? null : best.title;
        }
      }

      setResults(items);
      setSuggestion(sugg);
      setLoading(false);
    };

    const t = setTimeout(run, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, seed, fuse]);

  const value: Ctx = useMemo(() => ({ open, setOpen, loading, results, suggestion, query, setQuery }), [open, loading, results, suggestion, query]);

  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx) throw new Error("useSearch must be used within <SearchProvider>");
  return ctx;
}
