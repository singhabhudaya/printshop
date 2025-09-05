// src/components/Header.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Menu, X, ShoppingCart } from "lucide-react";

/**
 * If you want header links to go to Shopify, set VITE_SHOP_ORIGIN
 * (e.g. https://shop.printingmuse.com). Otherwise internal routes are used.
 */
const SHOP_BASE = import.meta.env.VITE_SHOP_ORIGIN as string | undefined;

// Warm peach/gold palette
const BRAND_GOLD = "#C8A37A";
const BRAND_GOLD_DARK = "#B38960";
const BRAND_PEACH = "#F2E5D9";

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
function loginHref() {
  return SHOP_BASE ? `${SHOP_BASE}/account/login` : `/auth/login`;
}
function cartHref() {
  return SHOP_BASE ? `${SHOP_BASE}/cart` : `/cart`;
}

export default function Header() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // lock page scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  // shared classes for nav items (peach hover + gold text)
  const navItemClasses =
    "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 " +
    "text-gray-700 hover:text-[#B38960] hover:bg-[#F2E5D9]";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="text-2xl font-bold tracking-tight">
            <span className="text-gray-900">Printing</span>
            <span className="ml-0.5 text-[#C8A37A]">Muse</span>
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

          {/* Right-side actions */}
          <div className="flex items-center gap-4">
            {SHOP_BASE ? (
              <a
                href={cartHref()}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-[#B38960] transition-colors"
              >
                <ShoppingCart size={20} />
                <span className="sr-only">Cart</span>
              </a>
            ) : (
              <Link
                to={cartHref()}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-[#B38960] transition-colors"
              >
                <ShoppingCart size={20} />
                <span className="sr-only">Cart</span>
              </Link>
            )}

            {user ? (
              <div className="text-sm font-medium text-gray-700">Hi, {user.name}</div>
            ) : SHOP_BASE ? (
              <a
                href={loginHref()}
                className="hidden sm:inline-block px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-colors"
                style={{ backgroundColor: BRAND_GOLD }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD)}
              >
                Login
              </a>
            ) : (
              <Link
                to={loginHref()}
                className="hidden sm:inline-block px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-colors"
                style={{ backgroundColor: BRAND_GOLD }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD)}
              >
                Login
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
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden fixed inset-0 top-16 z-40 bg-white px-4 py-6">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const href = categoryHref(item.handle);
              return SHOP_BASE ? (
                <a
                  key={item.handle}
                  href={href}
                  onClick={closeMenu}
                  className="px-4 py-3 text-base font-medium rounded-lg"
                  style={{ backgroundColor: BRAND_PEACH, color: BRAND_GOLD_DARK }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.handle}
                  to={href}
                  onClick={closeMenu}
                  className="px-4 py-3 text-base font-medium rounded-lg"
                  style={{ backgroundColor: BRAND_PEACH, color: BRAND_GOLD_DARK }}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="border-t pt-4 mt-2">
              {user ? null : SHOP_BASE ? (
                <a
                  href={loginHref()}
                  onClick={closeMenu}
                  className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: BRAND_GOLD }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD_DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD)}
                >
                  Login
                </a>
              ) : (
                <Link
                  to={loginHref()}
                  onClick={closeMenu}
                  className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: BRAND_GOLD }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD_DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GOLD)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
