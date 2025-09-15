// src/components/Hero.tsx
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// ✅ Read once, works in Vite (available at build time)
const SHOP_URL = (import.meta as any)?.env?.VITE_SHOPIFY_URL as string | undefined;

type HeroSlide = {
  title: string;
  subtitle: string;
  image: string;
  /** Optional deep link for this slide; falls back to SHOP_URL if not provided */
  link?: string;
};

// 🔗 Per-slide links wired to your Shopify products
const slides: HeroSlide[] = [
  {
    title: "Skeleton Cases",
    subtitle: "From Skeleton cases, Magsafe charging pods, to fun gadgets—made in India",
    image: "/banners/hero-1.jpg",
    link: "https://printingmuse.myshopify.com/products/iphone-skeleton-case?variant=43477164851260",
  },
  {
    title: "Smart Products",
    subtitle: "Product shown above is a handbuilt Dasai Mochi robot",
    image: "/banners/hero-2.jpg",
    // no specific product link provided; fall back to main shop link if set
  },
  {
    title: "Trending This Week",
    subtitle: "Miniatures, decor & everyday hacks",
    image: "/banners/hero-3.jpg",
  },
  {
    title: "Watch Stands",
    subtitle: "Your Watch, But on a Pedestal",
    image: "/banners/hero-4.jpg",
  },
  {
    title: "Swipe Up Wallets",
    subtitle: "Your cards, in your ascend wallet",
    image: "/banners/hero-5.png",
    link: "https://printingmuse.myshopify.com/products/the-ascend-wallet-minimalist-swipe-up-card-holder?variant=43462717440060",
  },
  {
    title: "Quirky Keychains",
    subtitle: "Level up your EDC with our quirky keychains",
    image: "/banners/hero-6.jpg",
    link: "https://printingmuse.myshopify.com/products/minecraft-heart-keychain?variant=43497678503996",
  },
];

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.2, duration: 0.5 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const SwiperNavButtons = () => {
  const swiper = useSwiper();
  return (
    <>
      <button
        onClick={() => swiper.slidePrev()}
        className="absolute top-1/2 left-4 -translate-y-1/2 z-10 p-2 bg-white/60 hover:bg-white text-gray-900 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/swiper:opacity-100"
        aria-label="Previous slide"
        type="button"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => swiper.slideNext()}
        className="absolute top-1/2 right-4 -translate-y-1/2 z-10 p-2 bg-white/60 hover:bg-white text-gray-900 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/swiper:opacity-100"
        aria-label="Next slide"
        type="button"
      >
        <ChevronRight size={24} />
      </button>
    </>
  );
};

export default function Hero() {
  const onFallbackScroll = () => {
    // Fallback behavior if no link and no env is present
    const el = document.querySelector("#product-showcase");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getHref = (s: HeroSlide) => s.link || SHOP_URL || "#product-showcase";

  return (
    <>
      {/* Replace styled-jsx with a plain <style> tag */}
      <style>{`
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
              {({ isActive }) => (
                <div className="relative w-full h-full">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={i > 0 ? "lazy" : "eager"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  <motion.div
                    className="absolute left-6 right-6 md:left-12 bottom-12 text-white"
                    variants={textVariants}
                    initial="hidden"
                    animate={isActive ? "visible" : "hidden"}
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
                      {/* ✅ External link to Shopify if provided; otherwise main shop env; otherwise smooth scroll */}
                      <a
                        href={getHref(s)}
                        onClick={(e) => {
                          if (!s.link && !SHOP_URL) {
                            e.preventDefault();
                            onFallbackScroll();
                          }
                        }}
                        className="inline-block px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold shadow-lg hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-transform active:scale-95"
                        aria-label={`Shop now - ${s.title}`}
                      >
                        Shop Now
                      </a>
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
