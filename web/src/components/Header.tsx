// src/components/Header.tsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingCart,
  Search as SearchIcon,
  ArrowRight,
} from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Set VITE_SHOP_ORIGIN (e.g., https://shop.printingmuse.com) to send header links to Shopify.
 * If not set, links fall back to internal routes.
 */
const SHOP_BASE = import.meta.env.VITE_SHOP_ORIGIN as string | undefined;

// Premium palette
const BRONZE = "#A47C5B";
const BRONZE_DEEP = "#8B684B";
const CHAMPAGNE = "#F3E7DA";

type NavItem = { label: string; handle: string };
const navItems: NavItem[] = [
  { handle: "toys", label: "Toys" },
  { handle: "gadgets", label: "Gadgets" },
  { handle: "cosplay", label: "Cosplay" },
  { handle: "decor", label: "Decor" },
  { handle: "gifts", label: "Gifts" },
];

function categoryHref(handle: string) {
  return SHOP_BASE
    ? `${SHOP_BASE}/collections/${encodeURIComponent(handle)}`
    : `/category/${handle}`;
}
function cartHref() {
  return SHOP_BASE ? `${SHOP_BASE}/cart` : `/cart`;
}

/* ------------------------------------------------------------------ */
/* Search Modal (self-contained component inside this file)           */
/* ------------------------------------------------------------------ */

type Product = {
  id: string;
  title: string;
  price?: number;
  image?: string; // URL
  handle?: string; // product slug
  tags?: string[];
};

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  // If you already have a small local catalog in FE, pass it here to enable client-only search
  localProducts?: Product[];
  // If you have a backend search route, set to true to use /api/search?q=
  useApi?: boolean;
};

const SUGGESTION_LIMIT = 6;
const PRODUCT_LIMIT = 6;

function SearchModal({
  open,
  onClose,
  localProducts,
  useApi,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // debounce input
  const [qDebounced, setQDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // autofocus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setProducts([]);
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // run search
  useEffect(() => {
    if (!open) return;
    if (!qDebounced) {
      setProducts([]);
      setSuggestions([]);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        if (useApi) {
          // expected response: { products: Product[], suggestions: string[] }
          const res = await fetch(`/api/search?q=${encodeURIComponent(qDebounced)}`);
          const data = await res.json();
          setProducts((data.products ?? []).slice(0, PRODUCT_LIMIT));
          setSuggestions((data.suggestions ?? []).slice(0, SUGGESTION_LIMIT));
        } else if (localProducts?.length) {
          const q = qDebounced.toLowerCase();
          const filtered = localProducts.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q))
          );
          setProducts(filtered.slice(0, PRODUCT_LIMIT));

          const bag = new Set<string>();
          localProducts.forEach((p) => {
            p.title.split(" ").forEach((w) => {
              if (w.length > 2 && w.toLowerCase().startsWith(q)) bag.add(w);
            });
            p.tags?.forEach((t) => {
              if (t.length > 2 && t.toLowerCase().startsWith(q)) bag.add(t);
            });
          });
          setSuggestions(Array.from(bag).slice(0, SUGGESTION_LIMIT));
        } else {
          setProducts([]);
          setSuggestions([]);
        }
      } catch {
        setProducts([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [qDebounced, open, useApi, localProducts]);

  if (!open) return null;
  const container = typeof document !== "undefined" ? document.body : null;
  if (!container) return null;

  const goToFullSearch = () => {
    const url = SHOP_BASE
      ? `${SHOP_BASE}/search?q=${encodeURIComponent(query.trim())}`
      : `/search?q=${encodeURIComponent(query.trim())}`;
    window.location.href = url;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* panel */}
      <div className="absolute left-1/2 top-20 w-[min(1100px,92vw)] -translate-x-1/2 rounded-2xl bg-white shadow-2xl">
        {/* search row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <SearchIcon className="size-5 shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search products (press "/" to open)'
            className="w-full outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-md p-1 hover:bg-gray-100"
              aria-label="Clear"
            >
              <X className="size-5 text-gray-500" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        {/* results */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[70vh] overflow-y-auto">
          {/* suggestions */}
          <div className="p-4 border-r">
            <h4 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
              SUGGESTIONS
            </h4>
            {loading && !products.length && !suggestions.length ? (
              <p className="text-sm text-gray-500">Searching…</p>
            ) : suggestions.length ? (
              <ul className="space-y-1">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => setQuery(s)}
                      className="w-full rounded-md px-2 py-1 text-left hover:bg-gray-100"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No suggestions yet.</p>
            )}

            <div className="mt-6">
              <button
                onClick={goToFullSearch}
                disabled={!query.trim()}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                  query.trim()
                    ? "border-gray-300 hover:bg-gray-50"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Search for “{query || "…"}”
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* products */}
          <div className="p-4">
            <h4 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
              PRODUCTS
            </h4>

            {loading && !products.length ? (
              <p className="text-sm text-gray-500">Loading products…</p>
            ) : products.length ? (
              <ul className="divide-y">
                {products.map((p) => {
                  const href = p.handle
                    ? SHOP_BASE
                      ? `${SHOP_BASE}/products/${p.handle}`
                      : `/products/${p.handle}`
                    : "#";
                  return (
                    <li key={p.id}>
                      <a
                        href={href}
                        className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-md px-2"
                        onClick={onClose}
                      >
                        <div className="size-12 shrink-0 rounded-md bg-gray-100 overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.title}</p>
                          {p.price != null && (
                            <p className="text-sm text-gray-600">₹{p.price}</p>
                          )}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No products found.</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    container
  );
}

/* ------------------------------------------------------------------ */
/* Header with Search Icon                                            */
/* ------------------------------------------------------------------ */

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // lock page scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const navItemClasses =
    "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 " +
    "text-gray-700 hover:text-[#8B684B] hover:bg-[#F3E7DA]";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="text-2xl font-bold tracking-tight">
            <span className="text-gray-900">Printing</span>
            <span className="ml-0.5 text-[#A47C5B]">Muse</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const href = categoryHref(item.handle);
              return SHOP_BASE ? (
                <a key={item.handle} href={href} className={navItemClasses}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.handle} to={href} className={navItemClasses}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions (Search + Cart) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-[#8B684B] transition-colors"
              aria-label="Search"
              title='Press "/" to search'
            >
              <SearchIcon size={20} />
            </button>

            {/* Cart */}
            {SHOP_BASE ? (
              <a
                href={cartHref()}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-[#8B684B] transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
              </a>
            ) : (
              <Link
                to={cartHref()}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-[#8B684B] transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Open main menu"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 top-16 z-40 bg-white px-4 py-6"
        >
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const href = categoryHref(item.handle);
              const common = "px-4 py-3 text-base font-medium rounded-lg";
              const style = {
                backgroundColor: CHAMPAGNE as string,
                color: BRONZE_DEEP as string,
              };
              return SHOP_BASE ? (
                <a
                  key={item.handle}
                  href={href}
                  onClick={closeMenu}
                  className={common}
                  style={style}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.handle}
                  to={href}
                  onClick={closeMenu}
                  className={common}
                  style={style}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Search modal (client-only by default). Pass useApi to hit /api/search */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        // localProducts={[]} // optionally feed a small catalog for client-side search
        // useApi // ← uncomment when /api/search is ready
      />
    </header>
  );
}
