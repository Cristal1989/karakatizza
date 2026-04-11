import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/ordersApi";
import {
  getRouteDistanceKm,
  getDeliveryInfo,
} from "../services/deliveryService";
import { useSiteSettings } from "../context/SiteSettingsContext";
import {
  getTelegramCheckoutStatus,
  createCheckoutDraft,
  getCheckoutDraft,
  deleteCheckoutDraft,
} from "../api/crmApi";

export default function Checkout() {
  const { siteSettings } = useSiteSettings();
  const contacts = siteSettings?.contacts;
  const pickupAddress = contacts?.pickupAddress || "";
  const deliverySettings = siteSettings?.delivery;

  const deliveryEnabled = deliverySettings?.deliveryEnabled ?? true;
  const pickupEnabled = deliverySettings?.pickupEnabled ?? true;
  const orderDisabled = !deliveryEnabled && !pickupEnabled;

  const pickupDiscountPercent = deliverySettings?.pickupDiscountPercent ?? 5;

  const deliveryText = deliverySettings?.deliveryText || "";
  const pickupText = deliverySettings?.pickupText || "";

  const shopLocation = {
    lat: deliverySettings?.shopLat ?? 46.953807,
    lng: deliverySettings?.shopLng ?? 31.994199,
    address: deliverySettings?.shopAddress || pickupAddress || "",
  };

  const deliveryZones =
    Array.isArray(deliverySettings?.deliveryZones) &&
    deliverySettings.deliveryZones.length > 0
      ? deliverySettings.deliveryZones
      : [];

  const [form, setForm] = useState({
    name: "",
    phone: "+380",
    address: "",
    entrance: "",
    comment: "",
    paymentMethod: "cash",
    needExactTime: false,
    exactTime: "",
    soySauceCount: 1,
    gingerCount: 1,
    wasabiCount: 1,
  });

  const paymentSettings = siteSettings?.payment;

  const cardOnlineEnabled = paymentSettings?.cardOnlineEnabled ?? true;
  const bankTransferEnabled = paymentSettings?.bankTransferEnabled ?? false;

  const bankTransferCardNumber = paymentSettings?.bankTransferCardNumber || "";
  const bankTransferRecipient = paymentSettings?.bankTransferRecipient || "";
  const bankTransferBankName = paymentSettings?.bankTransferBankName || "";
  const bankTransferHint = paymentSettings?.bankTransferHint || "";

  const texts = siteSettings?.texts;

  const checkoutCommentPlaceholder =
    texts?.checkoutCommentPlaceholder || "Коментар до замовлення";

  const checkoutExactTimeLabel =
    texts?.checkoutExactTimeLabel || "Потрібно на певний час";

  const [telegramCheckoutStatus, setTelegramCheckoutStatus] = useState(null);
  const [telegramCheckoutLoading, setTelegramCheckoutLoading] = useState(false);
  const [telegramCheckoutError, setTelegramCheckoutError] = useState("");

  const CHECKOUT_DRAFT_KEY = "kara_checkout_draft_v1";

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const TELEGRAM_RETURN_FLAG_KEY = "kara_telegram_return_checkout";

  const isTelegramReturnFromUrl = searchParams.get("tg") === "1";

  const activeTelegramGift = telegramCheckoutStatus?.activeGift || null;

  const shouldShowTelegramGiftCard = Boolean(
    !telegramCheckoutLoading &&
      !telegramCheckoutError &&
      telegramCheckoutStatus &&
      telegramCheckoutStatus.telegramLinked === true &&
      activeTelegramGift &&
      !activeTelegramGift.used_at &&
      ["issued", "reserved"].includes(
        String(activeTelegramGift.status || "").toLowerCase()
      ) &&
      (telegramCheckoutStatus.canUseGiftNow === true ||
        typeof telegramCheckoutStatus.ordersLeftUntilGift === "number")
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isTelegramReturnFromUrl) {
      sessionStorage.setItem(TELEGRAM_RETURN_FLAG_KEY, "1");
    }
  }, [isTelegramReturnFromUrl]);

  useEffect(() => {
    if (!isTelegramReturnFromUrl) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("tg");
    window.history.replaceState({}, "", url.toString());
  }, [isTelegramReturnFromUrl]);

  const { cartItems, clearCart, totalPrice } = useCart();
  const {
    checkoutMode,
    setCheckoutMode,
    confirmedAddress,
    regularSticksCount,
    setRegularSticksCount,
    trainingSticksCount,
    setTrainingSticksCount,
    sticksExtraPrice,
    checkoutTotalPrice,
    hasAnyPromoInCart,
    finalTotal,
    pickupDiscount,
  } = useCart();

  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const TELEGRAM_BOT_USERNAME = "crm_karakatizza_bot";

  const checkoutPhoneValue = useMemo(() => {
    return String(form?.phone || "").trim();
  }, [form?.phone]);

  const isMobile = window.innerWidth <= 768;

  const compactGrid2Style = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
    gap: "12px",
  };

  const compactGrid3Style = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: isMobile ? "8px" : "14px",
    alignItems: "stretch",
  };

  const compactGrid2EqualStyle = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(2, minmax(0, 1fr))",
    gap: isMobile ? "10px" : "14px",
    alignItems: "stretch",
  };
  const fieldStyle = {
    width: "100%",
    height: "46px",
    border: "1px solid #e5e0da",
    borderRadius: "14px",
    padding: "0 14px",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    color: "#222",
  };

  const miniSelectStyle = {
    ...fieldStyle,
    width: "100%",
    minWidth: 0,
    paddingRight: "10px",
  };

  const compactOptionCardStyle = {
    border: "1px solid #ece3dc",
    borderRadius: isMobile ? "14px" : "18px",
    background: "#fffdfa",
    padding: isMobile ? "10px 8px" : "16px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: isMobile ? "104px" : "124px",
    boxSizing: "border-box",
  };

  const compactOptionTitleStyle = {
    fontSize: isMobile ? "13px" : "18px",
    fontWeight: 800,
    color: "#222",
    marginBottom: isMobile ? "6px" : "10px",
    lineHeight: 1.15,
    textAlign: "center",
  };

  const compactFreeStyle = {
    fontSize: isMobile ? "11px" : "14px",
    color: "#7b746e",
    textAlign: "center",
    lineHeight: 1.2,
  };

  const compactExtraStyle = {
    marginTop: "4px",
    fontSize: isMobile ? "11px" : "13px",
    color: "#c56542",
    fontWeight: 600,
    textAlign: "center",
  };

  const compactQtyWrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? "6px" : "12px",
    marginTop: "2px",
    marginBottom: isMobile ? "6px" : "10px",
  };

  const compactQtyBtnStyle = {
    width: isMobile ? "28px" : "36px",
    height: isMobile ? "28px" : "36px",
    borderRadius: isMobile ? "8px" : "10px",
    border: "1px solid #e6ddd6",
    background: "#f7f3ef",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "16px" : "19px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  };

  const compactQtyValueStyle = {
    minWidth: isMobile ? "16px" : "24px",
    textAlign: "center",
    fontSize: isMobile ? "15px" : "18px",
    fontWeight: 700,
    color: "#222",
  };

  const sectionCardStyle = {
    background: "#fff",
    border: "1px solid #ece7e2",
    borderRadius: "16px",
    padding: isMobile ? "12px" : "14px",
    marginTop: "10px",
    boxSizing: "border-box",
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? "17px" : "19px",
    fontWeight: 800,
    marginBottom: "6px",
    color: "#222",
  };

  const sectionHintStyle = {
    fontSize: "12px",
    color: "#7a746e",
    marginBottom: "10px",
    lineHeight: 1.35,
  };

  const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    fontSize: "15px",
    color: "#555",
  };

  const submitButtonStyle = {
    width: "100%",
    marginTop: "14px",
    height: "52px",
    border: "none",
    borderRadius: "14px",
    background: "#d96f55",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.8 : 1,
  };

  const fieldLabelStyle = {
    fontSize: "14px",
    fontWeight: 700,
    color: "#333",
    marginBottom: "6px",
  };

  const tabsWrapStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "14px",
  };

  const tabBaseStyle = {
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #e8e1da",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  };

  const activeTabStyle = {
    ...tabBaseStyle,
    background: "#d96f55",
    color: "#fff",
    border: "1px solid #d96f55",
  };

  const inactiveTabStyle = {
    ...tabBaseStyle,
    background: "#f7f4f1",
    color: "#444",
  };

  const checkboxRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "4px",
    fontSize: "15px",
    color: "#333",
  };

  const exactTimeInputStyle = {
    ...fieldStyle,
    marginTop: "10px",
  };

  const addressStatusStyle = {
    marginTop: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.4,
    border: "1px solid #e8e1da",
  };

  const successStatusStyle = {
    ...addressStatusStyle,
    background: "#f3fbf4",
    border: "1px solid #cfe8d3",
    color: "#2f6b3d",
  };

  const warningStatusStyle = {
    ...addressStatusStyle,
    background: "#fff8ef",
    border: "1px solid #f1dfbf",
    color: "#8a5a1f",
  };
  const mobileListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const mobileItemStyle = {
    border: "1px solid #ece3dc",
    borderRadius: "14px",
    background: "#fffdfa",
    padding: "10px 12px",
  };

  const mobileRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const mobileLeftStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "4px",
    minWidth: 0,
    flex: 1,
  };

  const mobileTitleStyle = {
    fontSize: "16px",
    fontWeight: 700,
    color: "#222",
    lineHeight: 1.2,
  };

  const mobileMetaStyle = {
    fontSize: "12px",
    color: "#7b746e",
    lineHeight: 1.25,
  };

  const mobileExtraStyle = {
    fontSize: "12px",
    color: "#c56542",
    fontWeight: 600,
    lineHeight: 1.25,
  };

  const mobileQtyWrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    flexShrink: 0,
  };

  const mobileQtyBtnStyle = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid #e6ddd6",
    background: "#f7f3ef",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    lineHeight: "1",
  };

  const mobileQtyValueStyle = {
    minWidth: "18px",
    textAlign: "center",
    fontSize: "15px",
    fontWeight: 700,
    color: "#222",
  };

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'-]+$/;
  const phoneRegex = /^\+380\d{9}$/;
  const addressRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ0-9\s./,\-]+$/;

  const hasSushiItems = cartItems.some((item) => {
    const category = item.category?.toLowerCase?.() || "";
    return (
      category === "роллы" ||
      category === "rolls" ||
      category === "маки" ||
      category === "maki" ||
      category === "сеты" ||
      category === "sets"
    );
  });

  const freeCondiments = cartItems.reduce(
    (acc, item) => {
      if (item.isGiftRoll || item.isDiscountOffer) {
        return acc;
      }

      const category = item.category?.toLowerCase?.() || "";
      const paidQty = item.paidQuantity ?? item.quantity ?? 0;

      const isRoll = category === "роллы" || category === "rolls";
      const isMaki = category === "маки" || category === "maki";
      const isSet = category === "сеты" || category === "sets";

      if (isRoll || isMaki) {
        acc.soy += paidQty;
        acc.ginger += paidQty;
        acc.wasabi += paidQty;
      }

      if (isSet) {
        acc.soy += Number(item.freeSoySauce || 0) * paidQty;
        acc.ginger += Number(item.freeGinger || 0) * paidQty;
        acc.wasabi += Number(item.freeWasabi || 0) * paidQty;
      }

      return acc;
    },
    { soy: 0, ginger: 0, wasabi: 0 }
  );

  const extraSoyCount = Math.max(0, form.soySauceCount - freeCondiments.soy);
  const extraGingerCount = Math.max(
    0,
    form.gingerCount - freeCondiments.ginger
  );
  const extraWasabiCount = Math.max(
    0,
    form.wasabiCount - freeCondiments.wasabi
  );

  const condimentsExtraPrice =
    extraSoyCount * 15 + extraGingerCount * 15 + extraWasabiCount * 10;
  const finalCheckoutTotal = checkoutTotalPrice + condimentsExtraPrice;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw);

      setForm((prev) => ({
        ...prev,
        name: draft.name || "",
        phone: draft.phone || "+380",
        address: draft.address || "",
        entrance: draft.entrance || "",
        comment: draft.comment || "",
        paymentMethod: draft.paymentMethod || prev.paymentMethod,
        needExactTime: Boolean(draft.needExactTime),
        exactTime: draft.exactTime || "",
      }));

      if (
        draft.checkoutMode === "pickup" ||
        draft.checkoutMode === "delivery"
      ) {
        setCheckoutMode(draft.checkoutMode);
      }
    } catch (error) {
      console.error("CHECKOUT DRAFT LOAD ERROR:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const draft = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        entrance: form.entrance,
        comment: form.comment,
        paymentMethod: form.paymentMethod,
        checkoutMode,
        needExactTime: form.needExactTime,
        exactTime: form.exactTime,
      };

      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("CHECKOUT DRAFT SAVE ERROR:", error);
    }
  }, [
    form.name,
    form.phone,
    form.address,
    form.entrance,
    form.comment,
    form.paymentMethod,
    checkoutMode,
    form.needExactTime,
    form.exactTime,
  ]);

  useEffect(() => {
    if (confirmedAddress && checkoutMode === "delivery") {
      setForm((prev) => ({
        ...prev,
        address: confirmedAddress,
      }));
    }

    if (checkoutMode === "pickup") {
      setForm((prev) => ({
        ...prev,
        address: "",
      }));
      setError("");
    }
  }, [confirmedAddress, checkoutMode]);

  useEffect(() => {
    const cleanPhone = String(checkoutPhoneValue || "").trim();
    const digits = cleanPhone.replace(/\D/g, "");
    const isCompleteUaPhone = digits.length === 12 && digits.startsWith("380");

    if (!cleanPhone || !isCompleteUaPhone) {
      setTelegramCheckoutStatus(null);
      setTelegramCheckoutError("");
      setTelegramCheckoutLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setTelegramCheckoutLoading(true);
        setTelegramCheckoutError("");

        const data = await getTelegramCheckoutStatus(cleanPhone);
        setTelegramCheckoutStatus(data || null);
      } catch (error) {
        console.error("CHECKOUT TELEGRAM STATUS ERROR:", error);
        setTelegramCheckoutStatus(null);
        setTelegramCheckoutError(
          "Не вдалося перевірити Telegram-бонус для цього номера"
        );
      } finally {
        setTelegramCheckoutLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [checkoutPhoneValue]);

  useEffect(() => {
    if (!deliveryEnabled && checkoutMode === "delivery" && pickupEnabled) {
      setCheckoutMode("pickup");
    }

    if (!pickupEnabled && checkoutMode === "pickup" && deliveryEnabled) {
      setCheckoutMode("delivery");
    }
  }, [deliveryEnabled, pickupEnabled, checkoutMode, setCheckoutMode]);

  useEffect(() => {
    if (!deliveryEnabled && pickupEnabled) {
      setCheckoutMode("pickup");
    }

    if (!pickupEnabled && deliveryEnabled) {
      setCheckoutMode("delivery");
    }
  }, [deliveryEnabled, pickupEnabled, setCheckoutMode]);

  useEffect(() => {
    if (form.paymentMethod === "card" && !cardOnlineEnabled) {
      if (bankTransferEnabled) {
        setForm((prev) => ({
          ...prev,
          paymentMethod: "bank_transfer",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          paymentMethod: "cash",
        }));
      }
    }

    if (form.paymentMethod === "bank_transfer" && !bankTransferEnabled) {
      if (cardOnlineEnabled) {
        setForm((prev) => ({
          ...prev,
          paymentMethod: "card",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          paymentMethod: "cash",
        }));
      }
    }
  }, [form.paymentMethod, cardOnlineEnabled, bankTransferEnabled]);

  useEffect(() => {
    if (!hasSushiItems) {
      setForm((prev) => ({
        ...prev,
        soySauceCount: 0,
        gingerCount: 0,
        wasabiCount: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      soySauceCount:
        prev.soySauceCount === 0 && freeCondiments.soy > 0
          ? 1
          : prev.soySauceCount,
      gingerCount:
        prev.gingerCount === 0 && freeCondiments.ginger > 0
          ? 1
          : prev.gingerCount,
      wasabiCount:
        prev.wasabiCount === 0 && freeCondiments.wasabi > 0
          ? 1
          : prev.wasabiCount,
    }));
  }, [
    hasSushiItems,
    freeCondiments.soy,
    freeCondiments.ginger,
    freeCondiments.wasabi,
  ]);

  useEffect(() => {
    if (checkoutMode === "pickup") {
      setForm((prev) => ({
        ...prev,
        address: "",
      }));
      setDeliveryInfo(null);
      setDeliveryError("");
    }
  }, [checkoutMode]);

  useEffect(() => {
    const draftToken = searchParams.get("draft");

    if (!draftToken) return;

    let isMounted = true;

    async function restoreDraftFromServer() {
      try {
        const response = await getCheckoutDraft(draftToken);
        const draft = response?.draft;

        if (!isMounted || !draft) return;

        setForm((prev) => ({
          ...prev,
          name: draft.name ?? prev.name,
          phone: draft.phone ?? prev.phone,
          address: draft.address ?? prev.address,
          entrance: draft.entrance ?? prev.entrance,
          comment: draft.comment ?? prev.comment,
          needExactTime:
            typeof draft.needExactTime === "boolean"
              ? draft.needExactTime
              : prev.needExactTime,
          exactTime: draft.exactTime ?? prev.exactTime,
        }));

        if (
          draft.checkoutMode === "pickup" ||
          draft.checkoutMode === "delivery"
        ) {
          setCheckoutMode(draft.checkoutMode);
        }

        await deleteCheckoutDraft(draftToken);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("draft");
        nextParams.delete("tg");
        setSearchParams(nextParams, { replace: true });
      } catch (error) {
        console.error("RESTORE CHECKOUT DRAFT ERROR:", error);
      }
    }

    restoreDraftFromServer();

    return () => {
      isMounted = false;
    };
  }, [searchParams, setSearchParams, setCheckoutMode]);

  const handleNameChange = (e) => {
    const value = e.target.value;

    if (value === "" || nameRegex.test(value)) {
      setForm((prev) => ({
        ...prev,
        name: value,
      }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, "");

    if (!value.startsWith("+380")) {
      if (value.startsWith("380")) {
        value = `+${value}`;
      } else {
        value = "+380";
      }
    }

    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setForm((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const validateForm = () => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedAddress = form.address.trim();

    if (!trimmedName) {
      return "Вкажіть ім'я";
    }

    if (!nameRegex.test(trimmedName)) {
      return "Ім'я може містити лише літери, пробіли, апостроф і дефіс";
    }

    if (!phoneRegex.test(trimmedPhone)) {
      return "Номер телефону має бути у форматі +380XXXXXXXXX";
    }

    if (checkoutMode === "delivery" && !form.address.trim()) {
      return "Вкажіть адресу доставки";
    }

    if (checkoutMode === "delivery" && !addressRegex.test(trimmedAddress)) {
      return "Адреса може містити лише літери, цифри, пробіли, крапку, кому, дефіс і слеш";
    }

    if (form.needExactTime && !form.exactTime.trim()) {
      return "Вкажіть час замовлення";
    }

    if (cartItems.length === 0) {
      return "Кошик порожній";
    }

    return "";
  };

  async function handleOpenTelegramForCheckout(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        entrance: form.entrance,
        comment: form.comment,
        checkoutMode,
        needExactTime: form.needExactTime === true,
        exactTime: form.exactTime,
      };

      try {
        localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
      } catch (error) {
        console.error("CHECKOUT LOCAL DRAFT SAVE ERROR:", error);
      }

      const draftResponse = await createCheckoutDraft(payload);
      const token = draftResponse?.token;

      if (!token) {
        throw new Error("Не вдалося отримати token чернетки");
      }

      const startParam = `checkout_${token}`;
      const telegramUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${startParam}`;

      window.location.assign(telegramUrl);
    } catch (error) {
      console.error("OPEN TELEGRAM FOR CHECKOUT ERROR:", error);
      alert(error?.message || "Не вдалося відкрити Telegram");
    }
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let checkedDeliveryInfo = deliveryInfo;

      if (checkoutMode === "delivery") {
        const result = await handleCheckDelivery();

        if (result) {
          checkedDeliveryInfo = result;
        } else {
          checkedDeliveryInfo = {
            type: "operator",
            addressFound: false,
            resolvedAddress: "",
            shortAddress: form.address.trim(),
            minOrder: null,
            remaining: 0,
            freeDelivery: false,
          };
        }

        checkedDeliveryInfo = {
          ...checkedDeliveryInfo,
          shortAddress: form.address.trim(),
        };
      }

      const freshTelegramStatus = await getTelegramCheckoutStatus(
        form.phone.trim()
      );

      const activeTelegramGift =
        freshTelegramStatus?.activeGift ||
        telegramCheckoutStatus?.activeGift ||
        null;

      const freshOrdersCount = Number(freshTelegramStatus?.ordersCount ?? 0);

      const freshAvailableAfterOrdersCount = activeTelegramGift
        ? Number(activeTelegramGift.available_after_orders_count ?? 0)
        : null;

      const telegramCanUseNowDirect = Boolean(
        activeTelegramGift &&
          (freshAvailableAfterOrdersCount === null ||
            freshAvailableAfterOrdersCount <= 0 ||
            freshOrdersCount >= freshAvailableAfterOrdersCount)
      );

      const itemsForOrder = [
        ...cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          paidQuantity: item.paidQuantity ?? item.quantity,
          freeQuantity: item.freeQuantity ?? 0,
          price: item.price,
          lineTotal:
            item.lineTotal ?? item.price * (item.paidQuantity ?? item.quantity),
          isDiscountOffer: item.isDiscountOffer ?? false,
          discountLabel: item.discountLabel || "",
        })),
      ];

      if (telegramCanUseNowDirect && activeTelegramGift) {
        itemsForOrder.push({
          name: activeTelegramGift.gift_roll_title || "Подарунковий рол",
          quantity: 1,
          paidQuantity: 0,
          freeQuantity: 1,
          price: 0,
          lineTotal: 0,
          isTelegramGift: true,
          giftRollId: activeTelegramGift.gift_roll_id || "",
          discountLabel: "Telegram bonus",
        });
      }

      const orderData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        mode: checkoutMode,
        address:
          checkoutMode === "pickup"
            ? `Самовивіз: Миколаїв, ${pickupAddress}`
            : form.address.trim(),
        resolvedAddress:
          checkoutMode === "delivery"
            ? checkedDeliveryInfo?.resolvedAddress || ""
            : "",
        comment: form.comment.trim(),
        totalPrice: finalCheckoutTotal,
        entrance: form.entrance.trim(),
        paymentMethod: form.paymentMethod,
        needExactTime: form.needExactTime,
        exactTime: form.needExactTime ? form.exactTime.trim() : "",
        condiments: {
          soySauceCount: form.soySauceCount,
          gingerCount: form.gingerCount,
          wasabiCount: form.wasabiCount,
          freeSoySauce: freeCondiments.soy,
          freeGinger: freeCondiments.ginger,
          freeWasabi: freeCondiments.wasabi,
          extraSoyCount,
          extraGingerCount,
          extraWasabiCount,
          extraPrice: condimentsExtraPrice,
        },
        regularSticksCount,
        trainingSticksCount,
        sticksExtraPrice,
        items: itemsForOrder,
        telegramBonusMeta: activeTelegramGift
          ? {
              giftId: activeTelegramGift.id,
              giftRollId: activeTelegramGift.gift_roll_id || "",
              giftRollTitle: activeTelegramGift.gift_roll_title || "",
              source: "telegram",
              status: activeTelegramGift.status || "issued",
              applied: telegramCanUseNowDirect,
              skipped: !telegramCanUseNowDirect,
              availableAfterOrdersCount:
                activeTelegramGift.available_after_orders_count ?? null,
            }
          : null,
      };

      await createOrder(orderData);

      clearCart();
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      sessionStorage.removeItem(TELEGRAM_RETURN_FLAG_KEY);
      navigate("/success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Не вдалося відправити замовлення");
    } finally {
      setLoading(false);
    }
  };

  async function handleCheckDelivery() {
    if (checkoutMode !== "delivery") return null;

    const rawAddress = form.address.trim();

    if (!rawAddress) {
      setDeliveryError("Введіть адресу доставки");
      setDeliveryInfo(null);
      return null;
    }

    try {
      setDeliveryLoading(true);
      setDeliveryError("");

      const location = await geocodeAddress(rawAddress);
      const distanceKm = await getRouteDistanceKm(
        location.lat,
        location.lng,
        shopLocation
      );

      const info = getDeliveryInfo(
        distanceKm,
        finalCheckoutTotal,
        deliveryZones.length > 0 ? deliveryZones : undefined
      );

      const nextDeliveryInfo = {
        ...info,
        lat: location.lat,
        lng: location.lng,
        resolvedAddress: location.displayName || rawAddress,
        shortAddress: rawAddress,
      };

      setDeliveryInfo(nextDeliveryInfo);
      return nextDeliveryInfo;
    } catch (error) {
      const fallbackInfo = {
        type: "operator",
        addressFound: false,
        resolvedAddress: "",
        shortAddress: rawAddress,
        minOrder: null,
        remaining: 0,
        freeDelivery: false,
      };

      setDeliveryInfo(fallbackInfo);
      setDeliveryError("");

      return null;
    } finally {
      setDeliveryLoading(false);
    }
  }

  async function geocodeAddress(addressText) {
    const query = encodeURIComponent(`Миколаїв, ${addressText}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&q=${query}`
    );

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Адресу не знайдено. Оператор уточнить після оформлення");
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  }

  console.log("CHECKOUT TELEGRAM STATUS", telegramCheckoutStatus);
  console.log("CHECKOUT ACTIVE GIFT", telegramCheckoutStatus?.activeGift);
  console.log("CHECKOUT LINKED", telegramCheckoutStatus?.telegramLinked);
  console.log("CHECKOUT canUseGiftNow", telegramCheckoutStatus?.canUseGiftNow);
  console.log(
    "CHECKOUT ordersLeftUntilGift",
    telegramCheckoutStatus?.ordersLeftUntilGift
  );

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: isMobile ? "12px" : "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              border: "none",
              background: "none",
              color: "#ef4444",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            ← Назад у меню
          </button>

          {orderDisabled && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1.5,
                marginBottom: "16px",
              }}
            >
              Наразі оформлення замовлення тимчасово недоступне, оскільки
              вимкнені і доставка, і самовивіз.
            </div>
          )}

          <div style={sectionCardStyle}>
            <div
              style={{
                fontSize: isMobile ? "26px" : "32px",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#222",
                marginBottom: "12px",
              }}
            >
              Оформлення замовлення
            </div>

            <div
              style={{
                ...tabsWrapStyle,
                gridTemplateColumns:
                  deliveryEnabled && pickupEnabled ? "1fr 1fr" : "1fr",
              }}
            >
              {!deliveryEnabled && !pickupEnabled && (
                <div style={warningStatusStyle}>
                  Тимчасово недоступні ні доставка, ні самовивіз. Зв'яжіться з
                  оператором.
                </div>
              )}

              {(deliveryEnabled || pickupEnabled) && (
                <>
                  {deliveryEnabled && (
                    <button
                      type="button"
                      style={
                        checkoutMode === "delivery"
                          ? activeTabStyle
                          : inactiveTabStyle
                      }
                      onClick={() => setCheckoutMode("delivery")}
                    >
                      Доставка
                    </button>
                  )}

                  {pickupEnabled && (
                    <button
                      type="button"
                      style={
                        checkoutMode === "pickup"
                          ? activeTabStyle
                          : inactiveTabStyle
                      }
                      onClick={() => setCheckoutMode("pickup")}
                    >
                      Самовивіз
                    </button>
                  )}

                  <div style={sectionHintStyle}>
                    {checkoutMode === "delivery"
                      ? deliveryText || "Заповніть дані для доставки"
                      : pickupText || "Заповніть дані для самовивозу"}
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "12px",
              }}
            >
              <div>
                <div style={fieldLabelStyle}>Ім'я</div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ваше ім'я"
                  style={fieldStyle}
                />
              </div>

              <div>
                <div style={fieldLabelStyle}>Телефон</div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="+380"
                  style={fieldStyle}
                />
              </div>
              {telegramCheckoutLoading && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 14,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      lineHeight: 1.45,
                    }}
                  >
                    Перевіряємо Telegram-бонус...
                  </div>
                </div>
              )}

              {!telegramCheckoutLoading && telegramCheckoutError ? (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 14,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#dc2626",
                      lineHeight: 1.45,
                    }}
                  >
                    {telegramCheckoutError}
                  </div>
                </div>
              ) : null}

              {!telegramCheckoutLoading &&
              !telegramCheckoutError &&
              telegramCheckoutStatus &&
              telegramCheckoutStatus.telegramLinked === false ? (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 14,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.35,
                    }}
                  >
                    🎁 Хочеш бонус до наступного замовлення?
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.45,
                    }}
                  >
                    Підпишись на Telegram-бота та підтвердь номер.
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenTelegramForCheckout}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 36,
                      padding: "0 14px",
                      borderRadius: 10,
                      background: "#d96f55",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      width: "fit-content",
                      border: "none",
                    }}
                  >
                    Перейти в Telegram
                  </button>
                </div>
              ) : null}

              {shouldShowTelegramGiftCard && (
                <div
                  style={{
                    marginTop: 12,
                    marginBottom: 14,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid #e7e5e4",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#1f2937",
                    }}
                  >
                    🎁 Для цього номера є активний бонус
                  </div>

                  {!!String(
                    activeTelegramGift?.gift_roll_title || ""
                  ).trim() && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "#374151",
                        fontWeight: 700,
                      }}
                    >
                      {activeTelegramGift.gift_roll_title}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      lineHeight: 1.45,
                      fontWeight: 700,
                      color: telegramCheckoutStatus?.canUseGiftNow
                        ? "#2f855a"
                        : "#a16207",
                    }}
                  >
                    {telegramCheckoutStatus?.canUseGiftNow
                      ? "Бонус буде використаний у цьому замовленні."
                      : typeof telegramCheckoutStatus?.ordersLeftUntilGift ===
                          "number" &&
                        telegramCheckoutStatus.ordersLeftUntilGift > 0
                      ? "Бонус активований, але буде доступний наступного замовлення."
                      : "Бонус активований, але поки що недоступний."}
                  </div>
                </div>
              )}

              {checkoutMode === "delivery" ? (
                <>
                  <div style={compactGrid2Style}>
                    <div>
                      <div style={fieldLabelStyle}>Адреса доставки</div>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Вулиця та номер будинку"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <div style={fieldLabelStyle}>Під'їзд</div>
                      <select
                        value={form.entrance || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            entrance: e.target.value,
                          }))
                        }
                        style={miniSelectStyle}
                      >
                        <option value="">Не обов'язково</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                  </div>

                  {deliveryInfo && (
                    <div
                      style={
                        deliveryInfo.addressFound === false
                          ? warningStatusStyle
                          : successStatusStyle
                      }
                    >
                      {deliveryInfo.addressFound === false ? (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            Не можу знайти адресу
                          </div>
                          <div>Уточніть адресу у оператора.</div>
                          {deliveryInfo.minOrder && (
                            <div style={{ marginTop: "4px" }}>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          )}
                        </>
                      ) : deliveryInfo.freeDelivery ? (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            У вас безкоштовна доставка
                          </div>
                          {deliveryInfo.minOrder ? (
                            <div>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            До безкоштовної доставки залишилось{" "}
                            {deliveryInfo.remaining} грн
                          </div>
                          {deliveryInfo.minOrder ? (
                            <div>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}

                  {deliveryError && (
                    <div style={warningStatusStyle}>{deliveryError}</div>
                  )}
                </>
              ) : (
                <div style={successStatusStyle}>
                  Самовивіз: Миколаїв, {shopLocation.address || pickupAddress}
                  {pickupDiscountPercent > 0 && (
                    <div style={{ marginTop: "6px", fontWeight: 700 }}>
                      Знижка на самовивіз: {pickupDiscountPercent}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>Оплата</div>

            <div style={tabsWrapStyle}>
              <button
                type="button"
                style={
                  form.paymentMethod === "cash"
                    ? activeTabStyle
                    : inactiveTabStyle
                }
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: "cash",
                  }))
                }
              >
                Готівка
              </button>

              {cardOnlineEnabled && (
                <button
                  type="button"
                  style={
                    form.paymentMethod === "card"
                      ? activeTabStyle
                      : inactiveTabStyle
                  }
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: "card",
                    }))
                  }
                >
                  Картка онлайн
                </button>
              )}

              {bankTransferEnabled && (
                <button
                  type="button"
                  style={
                    form.paymentMethod === "bank_transfer"
                      ? activeTabStyle
                      : inactiveTabStyle
                  }
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: "bank_transfer",
                    }))
                  }
                >
                  Переказ на карту
                </button>
              )}
            </div>

            {form.paymentMethod === "bank_transfer" && bankTransferEnabled && (
              <div
                style={{
                  marginTop: "14px",
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#9a3412",
                  }}
                >
                  Реквізити для переказу
                </div>

                {bankTransferCardNumber && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#7c2d12",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Картка:</strong> {bankTransferCardNumber}
                  </div>
                )}

                {bankTransferRecipient && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#7c2d12",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Отримувач:</strong> {bankTransferRecipient}
                  </div>
                )}

                {bankTransferBankName && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#7c2d12",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Банк:</strong> {bankTransferBankName}
                  </div>
                )}

                {bankTransferHint && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#9a3412",
                      lineHeight: 1.5,
                    }}
                  >
                    {bankTransferHint}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={form.needExactTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    needExactTime: e.target.checked,
                    exactTime: e.target.checked ? prev.exactTime : "",
                  }))
                }
              />
              {checkoutExactTimeLabel}
            </label>

            {form.needExactTime && (
              <input
                type="text"
                value={form.exactTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    exactTime: e.target.value,
                  }))
                }
                placeholder="Наприклад: 18:30"
                style={exactTimeInputStyle}
              />
            )}
          </div>
          {hasSushiItems && (
            <div style={sectionCardStyle}>
              <div style={sectionTitleStyle}>Додатки до ролів</div>

              <div style={sectionHintStyle}>
                Частина додається безкоштовно залежно від кількості ролів, макі
                та сетів.
              </div>

              {isMobile ? (
                <div style={mobileListStyle}>
                  <div style={mobileItemStyle}>
                    <div style={mobileRowStyle}>
                      <div style={mobileLeftStyle}>
                        <div style={mobileTitleStyle}>Соєвий соус</div>
                        <div style={mobileMetaStyle}>
                          Безкоштовно: {freeCondiments.soy}
                        </div>
                        {extraSoyCount > 0 && (
                          <div style={mobileExtraStyle}>
                            + {extraSoyCount} × 15 грн
                          </div>
                        )}
                      </div>

                      <div style={mobileQtyWrapStyle}>
                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              soySauceCount: Math.max(
                                0,
                                prev.soySauceCount - 1
                              ),
                            }))
                          }
                        >
                          -
                        </button>

                        <span style={mobileQtyValueStyle}>
                          {form.soySauceCount}
                        </span>

                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              soySauceCount: prev.soySauceCount + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={mobileItemStyle}>
                    <div style={mobileRowStyle}>
                      <div style={mobileLeftStyle}>
                        <div style={mobileTitleStyle}>Імбир</div>
                        <div style={mobileMetaStyle}>
                          Безкоштовно: {freeCondiments.ginger}
                        </div>
                        {extraGingerCount > 0 && (
                          <div style={mobileExtraStyle}>
                            + {extraGingerCount} × 15 грн
                          </div>
                        )}
                      </div>

                      <div style={mobileQtyWrapStyle}>
                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              gingerCount: Math.max(0, prev.gingerCount - 1),
                            }))
                          }
                        >
                          -
                        </button>

                        <span style={mobileQtyValueStyle}>
                          {form.gingerCount}
                        </span>

                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              gingerCount: prev.gingerCount + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={mobileItemStyle}>
                    <div style={mobileRowStyle}>
                      <div style={mobileLeftStyle}>
                        <div style={mobileTitleStyle}>Васабі</div>
                        <div style={mobileMetaStyle}>
                          Безкоштовно: {freeCondiments.wasabi}
                        </div>
                        {extraWasabiCount > 0 && (
                          <div style={mobileExtraStyle}>
                            + {extraWasabiCount} × 10 грн
                          </div>
                        )}
                      </div>

                      <div style={mobileQtyWrapStyle}>
                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              wasabiCount: Math.max(0, prev.wasabiCount - 1),
                            }))
                          }
                        >
                          -
                        </button>

                        <span style={mobileQtyValueStyle}>
                          {form.wasabiCount}
                        </span>

                        <button
                          type="button"
                          style={mobileQtyBtnStyle}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              wasabiCount: prev.wasabiCount + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={compactGrid3Style}>
                  <div style={compactOptionCardStyle}>
                    <div style={compactOptionTitleStyle}>Соєвий соус</div>

                    <div style={compactQtyWrapStyle}>
                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            soySauceCount: Math.max(0, prev.soySauceCount - 1),
                          }))
                        }
                      >
                        -
                      </button>

                      <span style={compactQtyValueStyle}>
                        {form.soySauceCount}
                      </span>

                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            soySauceCount: prev.soySauceCount + 1,
                          }))
                        }
                      >
                        +
                      </button>
                    </div>

                    <div style={compactFreeStyle}>
                      Безкоштовно: {freeCondiments.soy}
                    </div>

                    {extraSoyCount > 0 && (
                      <div style={compactExtraStyle}>
                        + {extraSoyCount} × 15 грн
                      </div>
                    )}
                  </div>

                  <div style={compactOptionCardStyle}>
                    <div style={compactOptionTitleStyle}>Імбир</div>

                    <div style={compactQtyWrapStyle}>
                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            gingerCount: Math.max(0, prev.gingerCount - 1),
                          }))
                        }
                      >
                        -
                      </button>

                      <span style={compactQtyValueStyle}>
                        {form.gingerCount}
                      </span>

                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            gingerCount: prev.gingerCount + 1,
                          }))
                        }
                      >
                        +
                      </button>
                    </div>

                    <div style={compactFreeStyle}>
                      Безкоштовно: {freeCondiments.ginger}
                    </div>

                    {extraGingerCount > 0 && (
                      <div style={compactExtraStyle}>
                        + {extraGingerCount} × 15 грн
                      </div>
                    )}
                  </div>

                  <div style={compactOptionCardStyle}>
                    <div style={compactOptionTitleStyle}>Васабі</div>

                    <div style={compactQtyWrapStyle}>
                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            wasabiCount: Math.max(0, prev.wasabiCount - 1),
                          }))
                        }
                      >
                        -
                      </button>

                      <span style={compactQtyValueStyle}>
                        {form.wasabiCount}
                      </span>

                      <button
                        type="button"
                        style={compactQtyBtnStyle}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            wasabiCount: prev.wasabiCount + 1,
                          }))
                        }
                      >
                        +
                      </button>
                    </div>

                    <div style={compactFreeStyle}>
                      Безкоштовно: {freeCondiments.wasabi}
                    </div>

                    {extraWasabiCount > 0 && (
                      <div style={compactExtraStyle}>
                        + {extraWasabiCount} × 10 грн
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>Палички</div>

            {isMobile ? (
              <div style={mobileListStyle}>
                <div style={mobileItemStyle}>
                  <div style={mobileRowStyle}>
                    <div style={mobileLeftStyle}>
                      <div style={mobileTitleStyle}>Звичайні</div>
                    </div>

                    <div style={mobileQtyWrapStyle}>
                      <button
                        type="button"
                        style={mobileQtyBtnStyle}
                        onClick={() =>
                          setRegularSticksCount((prev) => Math.max(0, prev - 1))
                        }
                      >
                        -
                      </button>

                      <span style={mobileQtyValueStyle}>
                        {regularSticksCount}
                      </span>

                      <button
                        type="button"
                        style={mobileQtyBtnStyle}
                        onClick={() =>
                          setRegularSticksCount((prev) => prev + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div style={mobileItemStyle}>
                  <div style={mobileRowStyle}>
                    <div style={mobileLeftStyle}>
                      <div style={mobileTitleStyle}>Навчальні (+2 грн)</div>
                      {sticksExtraPrice > 0 && (
                        <div style={mobileExtraStyle}>
                          Додатково: {sticksExtraPrice} грн
                        </div>
                      )}
                    </div>

                    <div style={mobileQtyWrapStyle}>
                      <button
                        type="button"
                        style={mobileQtyBtnStyle}
                        onClick={() =>
                          setTrainingSticksCount((prev) =>
                            Math.max(0, prev - 1)
                          )
                        }
                      >
                        -
                      </button>

                      <span style={mobileQtyValueStyle}>
                        {trainingSticksCount}
                      </span>

                      <button
                        type="button"
                        style={mobileQtyBtnStyle}
                        onClick={() =>
                          setTrainingSticksCount((prev) => prev + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={compactGrid2EqualStyle}>
                <div style={compactOptionCardStyle}>
                  <div style={compactOptionTitleStyle}>Звичайні</div>

                  <div style={compactQtyWrapStyle}>
                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setRegularSticksCount((prev) => Math.max(0, prev - 1))
                      }
                    >
                      -
                    </button>

                    <span style={compactQtyValueStyle}>
                      {regularSticksCount}
                    </span>

                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() => setRegularSticksCount((prev) => prev + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={compactOptionCardStyle}>
                  <div style={compactOptionTitleStyle}>Навчальні (+2 грн)</div>

                  <div style={compactQtyWrapStyle}>
                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setTrainingSticksCount((prev) => Math.max(0, prev - 1))
                      }
                    >
                      -
                    </button>

                    <span style={compactQtyValueStyle}>
                      {trainingSticksCount}
                    </span>

                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() => setTrainingSticksCount((prev) => prev + 1)}
                    >
                      +
                    </button>
                  </div>

                  {sticksExtraPrice > 0 && (
                    <div style={compactExtraStyle}>
                      Додатково: {sticksExtraPrice} грн
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>{checkoutCommentPlaceholder}</div>

            <textarea
              value={form.comment}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              placeholder="Наприклад: без дзвінка, залишити біля дверей"
              style={{
                width: "100%",
                minHeight: "96px",
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "14px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div
            style={{
              background: "#fffaf7",
              border: "1px solid #f0ddd1",
              borderRadius: "16px",
              padding: isMobile ? "14px" : "16px",
              marginTop: "12px",
            }}
          >
            <div style={summaryRowStyle}>
              <span>Сума товарів</span>
              <span>{totalPrice} грн</span>
            </div>

            {condimentsExtraPrice > 0 && (
              <div style={summaryRowStyle}>
                <span>Додаткові соуси / імбир / васабі</span>
                <span>{condimentsExtraPrice} грн</span>
              </div>
            )}

            {sticksExtraPrice > 0 && (
              <div style={summaryRowStyle}>
                <span>Навчальні палички</span>
                <span>{sticksExtraPrice} грн</span>
              </div>
            )}
            {pickupDiscount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                  fontSize: "14px",
                  color: "#16a34a",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                <span>Знижка самовивіз -{pickupDiscountPercent}%</span>
                <span>-{pickupDiscount} грн</span>
              </div>
            )}
            {checkoutMode === "pickup" &&
              pickupDiscount === 0 &&
              hasAnyPromoInCart && (
                <div
                  style={{
                    marginTop: "6px",
                    marginBottom: "6px",
                    fontSize: "12px",
                    color: "#a16207",
                    fontWeight: 600,
                  }}
                >
                  Знижка не діє разом з акціями
                </div>
              )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #ecd5c5",
                fontWeight: 800,
                fontSize: isMobile ? "18px" : "28px",
                color: "#222",
              }}
            >
              <span>До сплати</span>
              <span>{finalCheckoutTotal} грн</span>
            </div>
          </div>
          {error && (
            <div
              style={{
                marginTop: "12px",
                color: "#c65642",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="button"
            style={submitButtonStyle}
            onClick={() => {
              handleSubmit();
            }}
            disabled={orderDisabled || loading}
          >
            {loading ? "Відправка..." : "Підтвердити замовлення"}
          </button>
        </div>
      </div>
    </div>
  );
}
