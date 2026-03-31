import { useSiteSettings } from "../context/SiteSettingsContext";

export default function DeliveryProgress({ deliveryInfo }) {
  const { siteSettings } = useSiteSettings();

  const showFreeDeliveryProgress =
    siteSettings?.delivery?.showFreeDeliveryProgress ?? true;

  if (
    !showFreeDeliveryProgress ||
    !deliveryInfo ||
    deliveryInfo.type === "operator"
  ) {
    return null;
  }

  const minOrder = Number(deliveryInfo.minOrder ?? 0);
  const remaining = Number(deliveryInfo.remaining ?? 0);
  const isFreeReached = deliveryInfo.freeDelivery === true;

  const progressPercent =
    minOrder > 0
      ? Math.min(((minOrder - remaining) / minOrder) * 100, 100)
      : 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ececec",
        borderRadius: "16px",
        padding: "14px",
        display: "grid",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#222",
          lineHeight: 1.35,
        }}
      >
        {isFreeReached
          ? "Мінімальна сума для цієї зони виконана"
          : `Додайте ще ${remaining} грн до мінімальної суми`}
      </div>

      <div
        style={{
          width: "100%",
          height: "10px",
          backgroundColor: "#f0f0f0",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            backgroundColor: isFreeReached ? "#2e7d32" : "#f57c00",
            borderRadius: "999px",
            transition: "0.3s",
          }}
        />
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#666",
        }}
      >
        Поріг для поточної зони: {minOrder} грн
      </div>

      {remaining > 0 && (
        <div
          style={{
            fontSize: "13px",
            color: "#666",
            lineHeight: 1.35,
          }}
        >
          До оформлення не вистачає: {remaining} грн
        </div>
      )}
    </div>
  );
}