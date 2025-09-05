// src/components/Header.tsx
import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Menu, X, ShoppingCart } from "lucide-react"; // Icon library

const navLinks = [
  { href: "/category/toys", label: "Toys" },
  { href: "/category/gadgets", label: "Gadgets" },
  { href: "/category/cosplay", label: "Cosplay" },
  { href: "/category/decor", label: "Decor" },
  { href: "/category/gifts", label: "Gifts" },
];

export default function Header() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Effect to prevent body scrolling when the mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" onClick={closeMenu} className="text-2xl font-bold tracking-tight">
              Creator<span className="text-indigo-600">Market</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right-side Actions */}
            <div className="flex items-center gap-4">
              <Link to="/cart" className="p-2 text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <ShoppingCart size={20} />
                <span className="sr-only">Cart</span> {/* For screen readers */}
              </Link>
              {user ? (
                <div className="text-sm font-medium text-gray-700">Hi, {user.name}</div>
              ) : (
                <Link to="/auth/login" className="hidden sm:inline-block px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors">
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-md"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden fixed inset-0 z-40 top-16 bg-white px-4 py-6">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `px-4 py-3 text-base font-medium rounded-lg ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t pt-4 mt-2">
                 {user ? null : ( // Only show Login if not logged in
                   <Link to="/auth/login" onClick={closeMenu} className="block w-full text-center px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium">
                     Login
                   </Link>
                 )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}