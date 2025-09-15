// This could be a new file: src/components/ProductRow.tsx
import { useRef } from 'react';
import { Product } from "../types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard"; // Assuming you created the new file
import { ChevronLeft, ChevronRight } from "lucide-react";

const Row = ({ title, items, isLoading }: { title: string; items: Product[]; isLoading?: boolean; }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  const content = isLoading 
    ? Array(6).fill(null).map((_, i) => <ProductCardSkeleton key={i} />) 
    : items.map((p) => <ProductCard product={p} key={p.id} />);

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        
        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {content}
        </div>
        
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default Row;