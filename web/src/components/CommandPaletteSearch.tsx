import React, { useEffect, useRef, useState } from "react";
import { useSearch } from "../state/SearchContext";
import { Search as SearchIcon, FolderOpen, BookOpen, Tag, Loader2, X, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

const BRONZE = "#A47C5B";
const CHAMPAGNE = "#F3E7DA";

// for building the “Search for …” CTA and for hard-nav on Enter
const SHOP_BASE = (import.meta as any).env.VITE_SHOP_ORIGIN as string | undefined;
const RAW_STORE = (import.meta as any).env.VITE_SHOPIFY_STORE_URL as string | undefined;
const STORE_BASE = RAW_STORE
  ? (RAW_STORE.startsWith("http") ? RAW_STORE : `https://${RAW_STORE}`).replace(/\/+$/, "")
  : undefined;

function shopLink(path: string): string | null {
  const base = (SHOP_BASE ? SHOP_BASE.replace(/\/+$/, "") : undefined) || STORE_BASE;
  return base ? `${base}${path}` : null;
}

export default function CommandPaletteSearch() {
  const { open, setOpen, query, setQuery, results, suggestion, loading } = useSearch();
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setActive(0);
    }
  }, [open]);

  // Up/Down + Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault(); setActive(a => Math.min(a + 1, Math.max(results.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault(); setActive(a => Math.max(a - 1, 0));
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results.length, setOpen]);

  // Enter behavior: product → collection → Shopify search page
  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();

    const product = results.find(r => r.type === "product");
    const collection = results.find(r => r.type === "collection");
    const item = product ?? collection ?? results[0];

    if (item) {
      if (item.url.startsWith("http")) {
        window.location.href = item.url;
      } else {
        const el = document.querySelector<HTMLAnchorElement>("#result-0");
        if (el) el.click();
      }
      return;
    }
    // No item — if query exists, go to Shopify search
    const s = query.trim();
    const searchUrl = s && shopLink(`/search?q=${encodeURIComponent(s)}`);
    if (searchUrl) window.location.href = searchUrl!;
  };

  if (!open) return null;

  const s = query.trim();
  const searchUrl = s && shopLink(`/search?q=${encodeURIComponent(s)}`);

  const suggestions = results.filter(r => r.type !== "product");
  const products = results.filter(r => r.type === "product");

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      <div className="absolute left-1/2 -translate-x-1/2 top-12 w-[min(960px,95vw)] mx-2 rounded-3xl shadow-2xl border bg-white overflow-hidden"
           style={{ borderColor: CHAMPAGNE }}>
        {/* top input */}
        <div className="relative p-4 sm:p-5 border-b" style={{ borderColor: CHAMPAGNE }}>
          <div className="flex items-center gap-2 rounded-full border px-4 py-2 sm:py-3"
               style={{ borderColor: CHAMPAGNE }}>
            <SearchIcon size={18} style={{ color: BRONZE }} className="shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search products, collections, or pages…"
              className="w-full outline-none placeholder-gray-400 text-[16px] sm:text-[17px] py-1.5"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-gray-100" aria-label="Clear">
                <X size={16} />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* left: suggestions */}
          <div className="border-r" style={{ borderColor: CHAMPAGNE }}>
            <div className="px-4 sm:px-6 pt-3 pb-2 text-[11px] tracking-[0.15em] text-gray-500">
              SUGGESTIONS
            </div>
            <div className="px-2 sm:px-4 pb-3">
              {suggestion && (
                <button
                  onClick={() => (setQuery(suggestion))}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">{suggestion}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Did you mean</div>
                </button>
              )}

              {suggestions.length === 0 && !loading && (
                <div className="px-3.5 py-2.5 text-sm text-gray-500">No suggestions.</div>
              )}

              {loading && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
              )}

              {!loading &&
                suggestions.map((r, i) => {
                  const Icon = r.type === "collection" ? FolderOpen : BookOpen;
                  const content = (
                    <div className="flex items-center gap-3">
                      <Icon size={16} style={{ color: BRONZE }} className="shrink-0" />
                      <div className="truncate">
                        <div className="font-medium truncate">{r.title}</div>
                      </div>
                    </div>
                  );
                  return r.url.startsWith("http") ? (
                    <a key={r.id} className="block px-3.5 py-2.5 rounded-lg hover:bg-gray-50" href={r.url}>
                      {content}
                    </a>
                  ) : (
                    <Link key={r.id} className="block px-3.5 py-2.5 rounded-lg hover:bg-gray-50" to={r.url} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* right: products */}
          <div>
            <div className="px-4 sm:px-6 pt-3 pb-2 text-[11px] tracking-[0.15em] text-gray-500">
              PRODUCTS
            </div>
            <div className="px-2 sm:px-4 pb-3">
              {products.length === 0 && !loading && (
                <div className="px-3.5 py-2.5 text-sm text-gray-500">No products yet.</div>
              )}
              {loading && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
              )}

              {!loading &&
                products.map((r, i) => {
                  const content = (
                    <div className="flex items-center gap-3">
                      {r.image ? (
                        <img src={r.image} alt="" className="h-12 w-12 sm:h-[56px] sm:w-[56px] rounded-md object-cover border"
                             style={{ borderColor: CHAMPAGNE }} />
                      ) : (
                        <div className="h-12 w-12 sm:h-[56px] sm:w-[56px] rounded-md border" style={{ borderColor: CHAMPAGNE }} />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.title}</div>
                        {/* @ts-ignore */}
                        {r.vendor && <div className="text-xs text-gray-500 truncate">{r.vendor}</div>}
                      </div>
                    </div>
                  );
                  return r.url.startsWith("http") ? (
                    <a key={r.id} id={`result-${i}`} className="block px-3.5 py-2.5 rounded-lg hover:bg-gray-50" href={r.url}>
                      {content}
                    </a>
                  ) : (
                    <Link key={r.id} id={`result-${i}`} className="block px-3.5 py-2.5 rounded-lg hover:bg-gray-50" to={r.url} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>

        {/* bottom “Search for …” CTA */}
        {s && (
          <div className="border-t" style={{ borderColor: CHAMPAGNE }}>
            <div className="px-4 sm:px-6 py-3">
              {searchUrl ? (
                <a href={searchUrl} className="flex items-center justify-between text-sm">
                  <span>Search for “{s}”</span>
                  <ArrowRight size={18} />
                </a>
              ) : (
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Search for “{s}”</span>
                  <ArrowRight size={18} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
