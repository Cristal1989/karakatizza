import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import "./HeroSlider.css";
import { getBanners } from "../api/bannersApi";
import { getImageUrl } from "../api/productsApi";

export default function HeroSlider() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    async function loadBanners() {
      try {
        const data = await getBanners();
        const activeBanners = data.filter((banner) => banner.isActive);
        setBanners(activeBanners);
      } catch (error) {
        console.error("BANNERS LOAD ERROR:", error);
      }
    }

    loadBanners();
  }, []);

  if (!banners.length) return null;

  return (
    <div className="heroSlider">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <a href={banner.link || "#menu"}>
              <div
                className="heroSlide"
                style={{ backgroundImage: `url(${getImageUrl(banner.image)})` }}
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
