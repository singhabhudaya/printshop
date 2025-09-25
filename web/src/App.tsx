// src/App.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Auto-scroll to top on every route change */}
      <ScrollToTop />

      {/* Site Header */}
      <Header />

      {/* Main content */}
      <main id="content" className="flex-1">
        <Outlet />
      </main>

      {/* Global Footer with policy links */}
      <Footer />
    </div>
  );
}
