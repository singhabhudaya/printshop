// src/components/Header.tsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Menu, X, Search as SearchIcon } from "lucide-react";
import CommandPaletteSearch from "./CommandPaletteSearch";
import { useSearch } from "../state/SearchContext";

/** Set VITE_SHOP_ORIGIN (e.g., https://shop.printingmuse.com) to send header links to Shopify. */
const SHOP_BASE = import.meta.env.VITE_SHOP_ORIGIN as string | undefined;

// Premium palette
const BRONZE = "#A47C5B";
const BRONZE_DEEP = "#8B684B";
const CHAMPAGNE = "#F3E7DA";

/*type NavItem = { label: string; handle: string };
const navItems: NavItem[] = [
  { handle: "toys", label: "Toys" },
  { handle: "gadgets", label: "Gadgets" },
  { handle: "cosplay", label: "Cosplay" },
  { handle: "decor", label: "Decor" },
  { handle: "gifts", label: "Gifts" },
];
*/
function categoryHref(handle: string) {
  return SHOP_BASE
    ? `${SHOP_BASE}/collections/${encodeURIComponent(handle)}`
    : `/category/${handle}`;
}
function loginHref() {
  return SHOP_BASE ? `${SHOP_BASE}/account/login` : `/auth/login`;
}
function registerHref() {
  // Shopify signup page is /account/register
  return SHOP_BASE ? `${SHOP_BASE}/account/register` : `/auth/register`;
}
// Always internal route for our app page
function imageToStlHref() {
  return "/image-to-stl";
}

export default function Header() {
  const { user, setUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // account dropdown
  const nav = useNavigate();
  const { setOpen: openSearch } = useSearch();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // lock page scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // close account dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const navItemClasses =
    "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 " +
    "text-gray-700 hover:text-[#8B684B] hover:bg-[#F3E7DA]";

  const bronzeBtn: React.CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${BRONZE} 0%, ${BRONZE_DEEP} 100%)`,
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              closeMenu();
              setMenuOpen(false);
            }}
            className="text-2xl font-bold tracking-tight"
          >
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

            {/* NEW: Image → STL link (always internal) */}
            <Link to={imageToStlHref()} className={navItemClasses}>
              Image → STL
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search (desktop) */}
            <button
              onClick={() => openSearch(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border hover:shadow-sm transition"
              style={{ borderColor: CHAMPAGNE }}
              aria-label="Search"
            >
              <SearchIcon size={16} style={{ color: BRONZE }} />
              <span className="text-sm">Search</span>
              <kbd
                className="ml-1 text-[10px] px-1.5 py-0.5 rounded border hidden lg:inline-block"
                style={{ borderColor: CHAMPAGNE }}
              >
                Ctrl K
              </kbd>
            </button>

            {/* Auth actions */}
            {!user ? (
              // Logged out: show Login + Sign up
              <div className="hidden sm:flex items-center gap-2">
                {SHOP_BASE ? (
                  <>
                    <a
                      href={loginHref()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-all ring-1 ring-[#E8DCCD]"
                      style={bronzeBtn}
                    >
                      Login
                    </a>
                    <a
                      href={registerHref()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-[#8B684B] ring-1 ring-[#E8DCCD] hover:bg-[#F3E7DA]"
                    >
                      Sign up
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      to={loginHref()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-all ring-1 ring-[#E8DCCD]"
                      style={bronzeBtn}
                    >
                      Login
                    </Link>
                    <Link
                      to={registerHref()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-[#8B684B] ring-1 ring-[#E8DCCD] hover:bg-[#F3E7DA]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            ) : (
              // Logged in: Account dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="px-3 py-1.5 rounded border hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  Hi, {user.name?.split(" ")[0] || "Account"}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg overflow-hidden z-50">
                    <Link
                      to="/account"
                      className="block px-3 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </Link>

                    {(user.role === "seller" || user.role === "admin") && (
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        setUser(null);
                        setMenuOpen(false);
                        nav("/");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile search button (NEW) */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="Search"
              onClick={() => openSearch(true)}
            >
              <SearchIcon size={20} />
            </button>

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
        <div id="mobile-menu" className="md:hidden fixed inset-0 top-16 z-40 bg-white px-4 py-6">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const href = categoryHref(item.handle);
              const common = "px-4 py-3 text-base font-medium rounded-lg";
              const style = { backgroundColor: CHAMPAGNE as string, color: BRONZE_DEEP as string };
              return SHOP_BASE ? (
                <a key={item.handle} href={href} onClick={closeMenu} className={common} style={style}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.handle} to={href} onClick={closeMenu} className={common} style={style}>
                  {item.label}
                </Link>
              );
            })}

            {/* NEW: Image → STL (mobile) */}
            <Link
              to={imageToStlHref()}
              onClick={closeMenu}
              className="px-4 py-3 text-base font-medium rounded-lg"
              style={{ backgroundColor: CHAMPAGNE as string, color: BRONZE_DEEP as string }}
            >
              Image → STL
            </Link>

            <div className="border-t pt-4 mt-2">
              {!user ? (
                <>
                  {SHOP_BASE ? (
                    <>
                      <a
                        href={loginHref()}
                        onClick={closeMenu}
                        className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-white ring-1 ring-[#E8DCCD] mb-2"
                        style={bronzeBtn}
                      >
                        Login
                      </a>
                      <a
                        href={registerHref()}
                        onClick={closeMenu}
                        className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-[#8B684B] ring-1 ring-[#E8DCCD]"
                      >
                        Sign up
                      </a>
                    </>
                  ) : (
                    <>
                      <Link
                        to={loginHref()}
                        onClick={closeMenu}
                        className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-white ring-1 ring-[#E8DCCD] mb-2"
                        style={bronzeBtn}
                      >
                        Login
                      </Link>
                      <Link
                        to={registerHref()}
                        onClick={closeMenu}
                        className="block w-full text-center px-4 py-3 rounded-lg font-semibold text-[#8B684B] ring-1 ring-[#E8DCCD]"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/account"
                    onClick={closeMenu}
                    className="block w-full text-center px-4 py-3 rounded-lg font-medium text-gray-700 border mb-2"
                  >
                    Account
                  </Link>
                  {(user.role === "seller" || user.role === "admin") && (
                    <Link
                      to="/dashboard"
                      onClick={closeMenu}
                      className="block w-full text-center px-4 py-3 rounded-lg font-medium text-gray-700 border"
                    >
                      Dashboard
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Mount the premium command palette once globally */}
      <CommandPaletteSearch />
    </header>
  );
}
