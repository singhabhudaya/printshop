// src/main.tsx
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";

import App from "./App";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Tier1Dashboard from "./pages/seller/Tier1Dashboard";
import Tier2Dashboard from "./pages/seller/Tier2Dashboard";
import Orders from "./pages/admin/Orders";
import Sellers from "./pages/admin/Sellers";
import Disputes from "./pages/admin/Disputes";
import ProtectedRoute from "./state/ProtectedRoute";
import { AuthProvider } from "./state/AuthContext";

// NEW: Account page
import Account from "./pages/account/Account";

// Policy & static
import TermsAndConditions from "./pages/termsandconditions";
import PrivacyPolicy from "./pages/privacypolicy";
import CancellationRefund from "./pages/cancellationrefund";
import ShippingDelivery from "./pages/shippingdelivery";
import ContactUs from "./pages/contactus";
import AboutUs from "./pages/aboutus";

// STL upload/quote (existing)
import StlQuotePage from "./pages/StlQuotePage";

// NEW: Image → STL page (lazy for better bundle)
const ImageToSTLPage = lazy(() => import("./pages/ImageToSTLPage"));

/** Small router component to map /dashboard to the right place.
 *  - sellers/admins -> Tier 1 (for now)
 *  - buyers -> Account
 */
function DashboardRouter() {
  // ProtectedRoute will already ensure user exists; this handles role-based redirect
  // If your ProtectedRoute is not wrapping this, add a null check here using your AuthContext.
  return <Navigate to="/seller/tier1" replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "product/:id", element: <ProductDetail /> },
      { path: "category/:id", element: <CategoryPage /> },
      { path: "cart", element: <Cart /> },

      // Auth
      { path: "auth/login", element: <Login /> },
      { path: "auth/register", element: <Register /> },

      // Account (any logged-in user)
      {
        path: "account",
        element: (
          <ProtectedRoute roles={["buyer", "seller", "admin"]}>
            <Account />
          </ProtectedRoute>
        ),
      },

      // Optional: generic /dashboard entry (guarded)
      {
        path: "dashboard",
        element: (
          <ProtectedRoute roles={["seller", "admin"]}>
            <DashboardRouter />
          </ProtectedRoute>
        ),
      },

      // Seller dashboards
      {
        path: "seller/tier1",
        element: (
          <ProtectedRoute roles={["seller", "admin"]}>
            <Tier1Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller/tier2",
        element: (
          <ProtectedRoute roles={["seller", "admin"]}>
            <Tier2Dashboard />
          </ProtectedRoute>
        ),
      },

      // Admin
      {
        path: "admin/orders",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/sellers",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <Sellers />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/disputes",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <Disputes />
          </ProtectedRoute>
        ),
      },

      // Public routes
      { path: "termsandconditions", element: <TermsAndConditions /> },
      { path: "privacypolicy", element: <PrivacyPolicy /> },
      { path: "cancellationrefund", element: <CancellationRefund /> },
      { path: "shippingdelivery", element: <ShippingDelivery /> },
      { path: "contactus", element: <ContactUs /> },
      { path: "aboutus", element: <AboutUs /> },
      { path: "custom-upload", element: <StlQuotePage /> },

      // NEW: Image → STL
      {
        path: "image-to-stl",
        element: (
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <ImageToSTLPage />
          </Suspense>
        ),
      },

      // Fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
