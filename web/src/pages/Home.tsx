// src/pages/Home.tsx
import Hero from "../components/Hero";
import FeaturedCategories from "../components/FeaturedCategories";
import ProductShowcase from "../components/ProductShowcase";
import ReviewsSection from "../components/ReviewsSection";
import CustomPrintCTA from "../components/CustomPrintCTA";
import TechIntegrated from "../components/TechIntegrated";

export default function Home() {
  return (
    <div className="space-y-10">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Hero />
      </div>

      <FeaturedCategories />
      <ProductShowcase />
      <ReviewsSection />
      <CustomPrintCTA />
      <TechIntegrated />
    </div>
  );
}
