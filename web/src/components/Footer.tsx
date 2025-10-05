// src/components/Footer.tsx
import { Link } from "react-router-dom";
import { Github, Twitter, Instagram } from "lucide-react"; // Or any other icons you prefer

const shopLinks = [
  { href: "/category/toys", label: "Toys" },
  { href: "/category/gadgets", label: "Gadgets" },
  { href: "/category/cosplay", label: "Cosplay" },
  { href: "/category/decor", label: "Decor" },
];

const companyLinks = [
  { href: "/aboutus", label: "About Us" },

  // { href: "/support", label: "Support" }, // keep here if you have a route
];

const legalLinks = [
  // ✅ Razorpay-required policy pages (wired to your routes)
  { href: "/termsandconditions", label: "Terms & Conditions" },
  { href: "/privacypolicy", label: "Privacy Policy" },
  { href: "/cancellationrefund", label: "Cancellation & Refund" },
  { href: "/shippingdelivery", label: "Shipping & Delivery" },
  { href: "/contactus", label: "Contact Us" },
];

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Github, label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Tagline section */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold tracking-tight">
              Printing<span className="text-[#A47C5B]">Muse</span>
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              
            </p>
            <div className="mt-4 flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-gray-500"
                  aria-label={social.label}
                >
                  <social.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>

            {/* Optional: quick contact snippet that matches your policy pages */}
            <p className="mt-4 text-sm text-gray-600">
              Email:{" "}
              <a className="underline" href="mailto:theprintingmuse@gmail.com">
                theprintingmuse@gmail.com
              </a>{" "}
              · Phone/WhatsApp: 8527229613
            </p>
          </div>

          {/* Link Sections */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Printing Muse. Made with ❤️ in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
