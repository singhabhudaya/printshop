// src/pages/Home.tsx
import Hero from "../components/Hero";
import FeaturedCategories from "../components/FeaturedCategories";
import ProductShowcase from "../components/ProductShowcase";
import ReviewsSection from "../components/ReviewsSection";
import CustomPrintCTA from "../components/CustomPrintCTA";
import TechIntegrated from "../components/TechIntegrated";

// NEW: Image → STL promo
import ImageToStlPromo from "../components/ImageToStlPromo";

export default function Home() {
  return (
    <>
      <div className="space-y-10">
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Hero />
        </div>

        <FeaturedCategories />
        <ProductShowcase />
        <ReviewsSection />

        {/* 🔥 New Image → STL promo (above existing CTA) */}
        <div className="max-w-6xl mx-auto px-4">
          <ImageToStlPromo />
        </div>

        {/* Existing custom-print CTA */}
        <CustomPrintCTA />

        <TechIntegrated />
      </div>

      {/* ✅ Optional: sticky mobile ribbon for quick access */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <a
          href="/image-to-stl"
          className="block w-full text-center rounded-xl px-4 py-3 font-semibold text-white shadow-lg"
          style={{ backgroundImage: "linear-gradient(135deg, #A47C5B 0%, #8B684B 100%)" }}
        >
          Image → STL (Beta)
        </a>
      </div>
    </>
  );
}
