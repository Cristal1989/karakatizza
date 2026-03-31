import React from "react";
import Seo from "../components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getWorkingHoursLabel } from "../utils/workingHours";

export default function DeliveryPage() {
  const navigate = useNavigate();
  const { siteSettings } = useSiteSettings();

  const workingHours = siteSettings?.workingHours;
  const contacts = siteSettings?.contacts;
  const delivery = siteSettings?.delivery;

  const workingHoursLabel = getWorkingHoursLabel(workingHours);

  const phonePrimary = contacts?.phonePrimary || "";
  const pickupAddress =
    delivery?.shopAddress || contacts?.pickupAddress || "Мала Морська 108";
  const mapLink = contacts?.mapLink || "";
  const instagramLink = contacts?.instagramLink || "";

  const deliveryEnabled = delivery?.deliveryEnabled ?? true;
  const pickupEnabled = delivery?.pickupEnabled ?? true;
  const pickupDiscountPercent = delivery?.pickupDiscountPercent ?? 5;

  const deliveryText =
    delivery?.deliveryText ||
    "Вартість і умови доставки залежать від району та відстані.";
  const pickupText =
    delivery?.pickupText ||
    "Самовивіз доступний після підтвердження замовлення оператором.";

  const deliveryZones = Array.isArray(delivery?.deliveryZones)
    ? [...delivery.deliveryZones].sort((a, b) => Number(a.maxKm) - Number(b.maxKm))
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Seo
        title="Доставка та самовивіз — Каракатица Миколаїв"
        description="Умови доставки та самовивозу Каракатица у Миколаєві. Дізнайтесь зони доставки, графік роботи та способи оплати."
        url="https://karakatizza.com/delivery"
      />

      <h1 style={{ display: "none" }}>Доставка суші та ролів у Миколаєві</h1>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
        <div
          style={{
            background: "rgb(47, 49, 54)",
            color: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              color: "#ffd54a",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Karakatizza • Миколаїв
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            Оплата і доставка
          </h2>

          <p
            style={{
              marginTop: "12px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Актуальні умови доставки, самовивозу та оплати.
          </p>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
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
              }}
            >
              Перейти в меню
            </Link>

            {phonePrimary && (
              <a
                href={`tel:${phonePrimary.replace(/\s+/g, "")}`}
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  padding: "12px 18px",
                  borderRadius: "14px",
                  fontWeight: 700,
                }}
              >
                {phonePrimary}
             </a>
            )}
          </div>
        </div>

        <Section title="Доставка" first>

          <Item title="Умови доставки">{deliveryText}</Item>

          <Item title="Час роботи">Щодня з {workingHoursLabel}.</Item>

          {deliveryZones.length > 0 && (
            <Item title="Зони доставки - безкоштовна доставка">
              <div style={{ display: "grid", gap: "8px" }}>
                {deliveryZones.map((zone, index) => (
                  <div
                    key={`${zone.maxKm}-${zone.minOrder}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <span>До {zone.maxKm} км</span>
                    <span>від {zone.minOrder} грн</span>
                  </div>
                ))}
              </div>
            </Item>
          )}
        </Section>

        <Section title="Самовивіз">

          <Item title="Адреса самовивозу">{pickupAddress}</Item>

          <Item title="Умови самовивозу">
            <div style={{ display: "grid", gap: "8px" }}>
              <div>{pickupText}</div>
              {pickupDiscountPercent > 0 && (
                <div style={{ fontWeight: 700, color: "#166534" }}>
                  Знижка на самовивіз: {pickupDiscountPercent}%
                </div>
              )}
            </div>
          </Item>

          {mapLink && (
            <Item title="Як нас знайти">
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#e85d3f",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Відкрити на мапі
              </a>
            </Item>
          )}
        </Section>

        <Section title="Оплата">
          <Item title="Готівкою">Оплата при отриманні замовлення.</Item>

          <Item title="Карткою">
            Спосіб оплати залежить від поточних налаштувань сайту та доступності
            при оформленні замовлення.
          </Item>
        </Section>

        {(phonePrimary || instagramLink) && (
          <Section title="Контакти">
            {phonePrimary && <Item title="Телефон">{phonePrimary}</Item>}

            {instagramLink && (
              <Item title="Instagram">
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#e85d3f",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Перейти в Instagram
                </a>
              </Item>
            )}
          </Section>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "16px",
            border: "1px solid #ececec",
            color: "#666",
            fontSize: "15px",
          }}
        >
          Умови доставки можуть змінюватися залежно від завантаженості, адреси
          та часу роботи. Актуальні параметри уточнюються під час оформлення.
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

function Section({ title, children, first = false }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          marginBottom: "12px",
          color: "#1e1e1e",
          marginLeft: first ? "14px" : 0,
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: "12px" }}>{children}</div>
    </div>
  );
}

function Item({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "18px 16px",
        border: "1px solid #ececec",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "16px",
          color: "#666",
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}