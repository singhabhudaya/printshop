// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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

// 🔽 Policy & static pages
import TermsAndConditions from "./pages/termsandconditions";
import PrivacyPolicy from "./pages/privacypolicy";
import CancellationRefund from "./pages/cancellationrefund";
import ShippingDelivery from "./pages/shippingdelivery";
import ContactUs from "./pages/contactus";
import AboutUs from "./pages/aboutus"; // ✅ new

// 🔽 NEW: STL Upload & Quote page
import StlQuotePage from "./pages/StlQuotePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "product/:id", element: <ProductDetail /> },
      { path: "category/:id", element: <CategoryPage /> },
      { path: "cart", element: <Cart /> },
      { path: "auth/login", element: <Login /> },
      { path: "auth/register", element: <Register /> },

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

      // 🔽 Public routes
      { path: "termsandconditions", element: <TermsAndConditions /> },
      { path: "privacypolicy", element: <PrivacyPolicy /> },
      { path: "cancellationrefund", element: <CancellationRefund /> },
      { path: "shippingdelivery", element: <ShippingDelivery /> },
      { path: "contactus", element: <ContactUs /> },
      { path: "aboutus", element: <AboutUs /> }, // ✅ new route

      // 🔽 NEW public route for STL uploads
      { path: "custom-upload", element: <StlQuotePage /> },
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
