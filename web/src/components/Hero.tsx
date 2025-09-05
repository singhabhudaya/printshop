// src/components/Hero.tsx
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Slide data moved outside the component for better performance and readability
const slides = [
  { title: "Skeleton Cases", subtitle: "From Skeleton cases, Magsafe charging pods, to fun gadgets—made in India", image: "/banners/hero-1.jpg" },
  { title: "Smart Products", subtitle: "Product shown above is a handbuilt Dasai Mochi robot", image: "/banners/hero-2.jpg" },
  { title: "Trending This Week", subtitle: "Miniatures, decor & everyday hacks", image: "/banners/hero-3.jpg" },
  { title: "Watch Stands", subtitle: "Your Watch, But on a Pedestal", image: "/banners/hero-4.jpg" },
];

// Animation variants for Framer Motion
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1, // Stagger animation of children
      delayChildren: 0.2,   // Wait a bit before children animate
      duration: 0.5
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Custom Swiper Navigation Component
const SwiperNavButtons = () => {
    const swiper = useSwiper();
    return (
        <>
            <button
                onClick={() => swiper.slidePrev()}
                className="absolute top-1/2 left-4 -translate-y-1/2 z-10 p-2 bg-white/60 hover:bg-white text-gray-900 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/swiper:opacity-100"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={() => swiper.slideNext()}
                className="absolute top-1/2 right-4 -translate-y-1/2 z-10 p-2 bg-white/60 hover:bg-white text-gray-900 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/swiper:opacity-100"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>
        </>
    );
};

export default function Hero() {
  const onShopNow = () => {
    const el = document.querySelector("#product-showcase");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* 
        This is a great place to put custom styles for third-party libraries like Swiper. 
        It keeps the styles co-located with the component.
      */}
      <style jsx global>{`
        .hero-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background-color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 5px;
          background-color: white;
        }
      `}</style>

      {/* For PRODUCTION: To optimize Largest Contentful Paint (LCP), preload the first hero image in your public/index.html file's <head> section:
          <link rel="preload" as="image" href="/banners/hero-1.jpg" />
      */}
      <section className="relative w-full group/swiper">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          loop
          className="hero-swiper w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden"
        >
          {slides.map((s, i) => (
            <SwiperSlide key={s.title}>
                {({ isActive }) => ( // useSwiperSlide hook is implicitly available here
                  <div className="relative w-full h-full">
                    <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover" loading={i > 0 ? 'lazy' : 'eager'} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    <motion.div
                      className="absolute left-6 right-6 md:left-12 bottom-12 text-white"
                      variants={textVariants}
                      initial="hidden"
                      animate={isActive ? "visible" : "hidden"} // Animate only when slide is active
                    >
                      {i === 0 ? (
                        <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
                          {s.title}
                        </motion.h1>
                      ) : (
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
                          {s.title}
                        </motion.h2>
                      )}
                      
                      <motion.p variants={itemVariants} className="mt-3 md:mt-4 text-base md:text-lg max-w-lg opacity-90">
                        {s.subtitle}
                      </motion.p>
                      
                      <motion.div variants={itemVariants} className="mt-8">
                        <button
                          onClick={onShopNow}
                          className="px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold shadow-lg hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-transform active:scale-95"
                        >
                          Shop Now
                        </button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
            </SwiperSlide>
          ))}
          <SwiperNavButtons />
        </Swiper>
      </section>
    </>
  );
}