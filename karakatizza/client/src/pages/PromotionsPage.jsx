import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { promotionsConfig } from "../config/promotions";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function PromotionsPage() {
  const navigate = useNavigate();
  const permanentPromos = [
    {
      title: "5% на самовивіз",
      text: "Забирайте замовлення самостійно та отримуйте знижку 5% на самовивіз.",
    },
    {
      title: "10% у день народження",
      text: "У день народження даруємо 10% знижки, щоб святкувати було ще смачніше.",
    },
  ];

  const activePromos = [];
  const { siteSettings } = useSiteSettings();
const contacts = siteSettings?.contacts;
const instagramLink = contacts?.instagramLink || "";

  // 1+1
  if (promotionsConfig.onePlusOne.enabled) {
    activePromos.push({
      title: "1+1=3",
      text: "Замовляйте два акційні роли та отримуйте третій у подарунок.",
    });
  }

  // Подарок от 700
  if (promotionsConfig.giftFrom700.enabled) {
    activePromos.push({
      title: "Рол у подарунок від 700 грн",
      text: "При замовленні від 700 грн додається акційний рол.",
    });
  }

  // СЕТ НЕДЕЛИ (если есть старая цена)
  if (promotionsConfig.setOfWeek.enabled) {
    activePromos.push({
      title: "Сет тижня",
      text: "Обраний сет зі знижкою цього тижня.",
    });
  }

  // РОЛ НЕДЕЛИ (если есть старая цена)
  if (promotionsConfig.rollOfWeek.enabled) {
    activePromos.push({
      title: "Рол тижня",
      text: "Спеціальна ціна на вибраний рол.",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <h1 style={{ display: "none" }}>
  Доставка суші та ролів у Миколаєві
</h1>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 16px 32px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "rgb(47, 49, 54",
            color: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              color: "#ffd54a",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Акції Karakatizza
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "34px",
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            Акції
          </h2>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: "18px",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.88)",
              maxWidth: "700px",
            }}
          >
            У Karakatizza завжди є привід замовити вигідніше. Ми регулярно
            запускаємо акції на роли, сети та подарунки до замовлення, а також
            залишаємо постійні знижки для наших гостей.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Перейти в меню
            </Link>

            <a
              href={instagramLink}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Instagram
            </a>
          </div>
        </div>

        <section style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#1e1e1e",
              marginBottom: "12px",
            }}
          >
            Постійні акції
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {permanentPromos.map((item) => (
              <div
                key={item.title}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "18px 16px",
                  border: "1px solid #ececec",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#fff3dc",
                    color: "#c98716",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "10px",
                  }}
                >
                  Постійно
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#222",
                    marginBottom: "8px",
                    lineHeight: 1.15,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: "#666",
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#1e1e1e",
              marginBottom: "12px",
            }}
          >
            Актуальні акції
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {activePromos.map((item) => (
              <div
                key={item.title}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "18px 16px",
                  border: "1px solid #ececec",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#ffe8e1",
                    color: "#d25f45",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "10px",
                  }}
                >
                  Зараз діє
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#222",
                    marginBottom: "8px",
                    lineHeight: 1.15,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: "#666",
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "16px",
            border: "1px solid #ececec",
            color: "#666",
            fontSize: "15px",
            lineHeight: 1.55,
          }}
        >
          Актуальні пропозиції можуть змінюватися. Деталі уточнюйте під час
          оформлення замовлення або слідкуйте за оновленнями на сайті та в
          Instagram.
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #ff7a3d, #e85d3f)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(232,93,63,0.25)",
            transition: "all 0.2s ease",
          }}
        >
          ← На головну
        </button>
      </div>
    </div>
  );
}
