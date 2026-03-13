import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import "./HeroSlider.css";
import { getBanners, trackBannerClick } from "../api/bannersApi";
import { getImageUrl } from "../api/productsApi";

function formatTimeLeft(endAt) {
  if (!endAt) return "";

  const diff = new Date(endAt).getTime() - Date.now();

  if (diff <= 0) return "Акція завершилась";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}д ${hours}г ${minutes}хв`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function HeroSlider() {
  const [banners, setBanners] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    async function loadBanners() {
      try {
        const data = await getBanners();
        const activeBanners = data
          .filter((banner) => banner.isActive)
          .sort((a, b) => Number(a.priority ?? 10) - Number(b.priority ?? 10));
        setBanners(activeBanners);
      } catch (error) {
        console.error("BANNERS LOAD ERROR:", error);
      }
    }

    loadBanners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isMobile = useMemo(() => window.innerWidth <= 768, []);

  const handleBannerClick = async (banner, e) => {
    e.preventDefault();

    try {
      await trackBannerClick(banner.id);
    } catch (error) {
      console.error("BANNER CLICK TRACK ERROR:", error);
    }

    const link = banner.link || "#menu";

    if (link.startsWith("#")) {
      const id = link.replace("#", "");
      const target = document.getElementById(id);

      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }

      return;
    }

    if (link.startsWith("category:")) {
      const categoryId = link.replace("category:", "");
      const tabsButton = document.querySelector(
        `[data-category-tab="${categoryId}"]`
      );
      if (tabsButton) {
        tabsButton.click();
      }

      const menu = document.getElementById("menu");
      if (menu) {
        menu.scrollIntoView({ behavior: "smooth" });
      }

      return;
    }

    if (link.startsWith("product:")) {
      const productId = link.replace("product:", "");
      const menu = document.getElementById("menu");
      if (menu) {
        menu.scrollIntoView({ behavior: "smooth" });
      }

      setTimeout(() => {
        const target = document.querySelector(
          `[data-product-id="${productId}"]`
        );
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);

      return;
    }

    window.location.href = link;
  };

  if (!banners.length) return null;

  return (
    <div className="heroSlider">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4500 }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
      >
        {banners.map((banner) => {
          const image =
            isMobile && banner.mobileImage ? banner.mobileImage : banner.image;

          const optimizedImage = getImageUrl(
            image,
            isMobile
              ? { width: 900, height: 420, crop: "fill" }
              : { width: 1600, height: 500, crop: "fill" }
          );

          return (
            <SwiperSlide key={banner.id}>
              <a
                href={banner.link || "#menu"}
                onClick={(e) => handleBannerClick(banner, e)}
              >
                <div
                  className="heroSlide"
                  style={{ backgroundImage: `url(${optimizedImage})` }}
                >
                  {banner.endAt && (
                    <div className="heroTimer">
                      ⏳ {formatTimeLeft(banner.endAt)}
                    </div>
                  )}
                </div>
              </a>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
