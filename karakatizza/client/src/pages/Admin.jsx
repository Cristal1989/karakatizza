import { useEffect, useMemo, useState } from "react";
import {
  getSiteSettings,
  updateWorkingHours,
  updatePopupSettings,
  updateContactsSettings,
  updateDeliverySettings,
  updatePaymentSettings,
  updateSiteTexts,
} from "../api/siteSettingsApi";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getImageUrl,
} from "../api/productsApi";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "../api/bannersApi";
import {
  getPromotionSettings,
  updatePromotionSettings,
} from "../api/promotionsApi";
import {
  getGiftRollSettings,
  updateGiftRollSettings,
} from "../api/giftRollApi";

const sidebarItems = [
  { key: "products", label: "Товари", icon: "🍣" },
  { key: "hero", label: "Банер на головній", icon: "🖼️" },
  { key: "promos", label: "Акції", icon: "🔥" },
  { key: "settings", label: "Налаштування", icon: "⚙️" },
];

const categoryOptions = [
  { value: "all", label: "Усі категорії" },
  { value: "rolls", label: "Роли" },
  { value: "maki", label: "Макі" },
  { value: "sets", label: "Сети" },
  { value: "sushi", label: "Суші" },
  { value: "sushi_burger", label: "Суші бургер" },
  { value: "snacks", label: "Салати і закуски" },
  { value: "bowls", label: "Суші боули" },
  { value: "drinks", label: "Напої" },
  { value: "extras", label: "Додатково" },
];
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Admin() {
  const [activeSection, setActiveSection] = useState("products");

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    category: "",
    description: "",
    weight: "",
    rollType: "",

    promoType: "none",
    priority: 10,
    discountOfferEligible: false,

    isVisible: true,
    isHit: false,
    isNew: false,
    isWeeklyOffer: false,

    freeSoySauce: 0,
    freeGinger: 0,
    freeWasabi: 0,
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [popular, setPopular] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerEditingId, setBannerEditingId] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerMobileImage, setBannerMobileImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerMobilePreview, setBannerMobilePreview] = useState("");
  const [dragBannerId, setDragBannerId] = useState(null);

  const [promotionMessage, setPromotionMessage] = useState("");
  const [promotionError, setPromotionError] = useState("");

  const [giftRollMessage, setGiftRollMessage] = useState("");
  const [giftRollError, setGiftRollError] = useState("");

  const [bannerForm, setBannerForm] = useState({
    title: "",
    link: "#menu",
    priority: 10,
    isActive: true,
    endAt: "",
  });

  const [promotionSettings, setPromotionSettings] = useState({
    discountPercent: 25,
    triggerSum: 600,
    isActive: true,
  });
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSaving, setPromotionSaving] = useState(false);

  const [giftRollSettings, setGiftRollSettings] = useState({
    triggerSum: 1000,
    giftProductId: "",
    isActive: true,
    weekdaysOnly: true,
  });

  const [giftRollLoading, setGiftRollLoading] = useState(false);
  const [giftRollSaving, setGiftRollSaving] = useState(false);

  const [popupSettings, setPopupSettings] = useState({
    showOutsideWorkingHours: true,
    closedToday: false,
    outsideHoursText: "",
    closedTodayText: "",
  });

  const [popupSaving, setPopupSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupError, setPopupError] = useState("");

  const [workingHoursSettings, setWorkingHoursSettings] = useState({
    openTime: "10:00",
    closeTime: "22:00",
    closedToday: false,
    allowOrdersAfterHours: true,
  });

  const [workingHoursSaving, setWorkingHoursSaving] = useState(false);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursMessage, setWorkingHoursMessage] = useState("");
  const [workingHoursError, setWorkingHoursError] = useState("");

  const [contactsSettings, setContactsSettings] = useState({
    phonePrimary: "",
    phoneSecondary: "",
    pickupAddress: "",
    mapLink: "",
    instagramLink: "",
    telegramLink: "",
    viberLink: "",
  });

  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsMessage, setContactsMessage] = useState("");
  const [contactsError, setContactsError] = useState("");

  const [deliverySettings, setDeliverySettings] = useState({
    deliveryEnabled: true,
    pickupEnabled: true,
    pickupDiscountPercent: 5,
    showFreeDeliveryProgress: true,
    deliveryText: "",
    pickupText: "",
    shopAddress: "Мала Морська 108",
    shopLat: 46.953807,
    shopLng: 31.994199,
    deliveryZones: [
      { maxKm: 2.5, minOrder: 400 },
      { maxKm: 4, minOrder: 500 },
      { maxKm: 5, minOrder: 600 },
      { maxKm: 6, minOrder: 700 },
      { maxKm: 8, minOrder: 800 },
      { maxKm: 10, minOrder: 1100 },
      { maxKm: 14, minOrder: 1300 },
    ],
  });

  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  const [paymentSettings, setPaymentSettings] = useState({
    cardOnlineEnabled: true,
    bankTransferEnabled: false,
    bankTransferCardNumber: "",
    bankTransferRecipient: "",
    bankTransferBankName: "",
    bankTransferHint: "",
  });

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [siteTexts, setSiteTexts] = useState({
    pickupSelectedText: "",
    deliveryAddressHint: "",
    deliveryAddressNotFoundText: "",
    orderDisabledText: "",
    checkoutCommentPlaceholder: "",
    checkoutExactTimeLabel: "",
    checkoutSuccessHint: "",
  });

  const [siteTextsSaving, setSiteTextsSaving] = useState(false);
  const [siteTextsMessage, setSiteTextsMessage] = useState("");
  const [siteTextsError, setSiteTextsError] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    marginTop: 4,
  };

  const textareaStyle = {
    width: "100%",
    marginTop: 10,
    padding: "10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    minHeight: 60,
  };

  const checkboxStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  };

  const settingsCardStyle = {
    background: "#fff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };

  const settingsTitleStyle = {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#111",
  };

  const settingsDescStyle = {
    margin: 0,
    color: "#666",
    fontSize: "15px",
    lineHeight: 1.5,
  };

  useEffect(() => {
    loadProducts();
    loadBanners();
    loadPromotionSettings();
    loadGiftRollSettings();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/site-settings`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        setSettings(data);
      } catch (e) {
        console.error("LOAD SETTINGS ERROR", e);
      }
    }

    loadSettings();
  }, []);

  useEffect(() => {
    const loadWorkingHoursSettings = async () => {
      try {
        setWorkingHoursLoading(true);
        setWorkingHoursError("");

        const settings = await getSiteSettings();

        if (settings?.workingHours) {
          setWorkingHoursSettings({
            openTime: settings.workingHours.openTime || "10:00",
            closeTime: settings.workingHours.closeTime || "22:00",
            closedToday: settings.workingHours.closedToday === true,
            allowOrdersAfterHours:
              settings.workingHours.allowOrdersAfterHours === true,
          });
        }
        if (settings?.popup) {
          setPopupSettings({
            showOutsideWorkingHours:
              settings.popup.showOutsideWorkingHours === true,
            closedToday: settings?.workingHours?.closedToday === true,
            outsideHoursText: settings.popup.outsideHoursText || "",
            closedTodayText: settings.popup.closedTodayText || "",
          });
        }
        if (settings?.contacts) {
          setContactsSettings({
            phonePrimary: settings.contacts.phonePrimary || "",
            phoneSecondary: settings.contacts.phoneSecondary || "",
            pickupAddress: settings.contacts.pickupAddress || "",
            mapLink: settings.contacts.mapLink || "",
            instagramLink: settings.contacts.instagramLink || "",
            telegramLink: settings.contacts.telegramLink || "",
            viberLink: settings.contacts.viberLink || "",
          });
        }
        if (settings?.delivery) {
          setDeliverySettings({
            deliveryEnabled: settings.delivery.deliveryEnabled === true,
            pickupEnabled: settings.delivery.pickupEnabled === true,
            pickupDiscountPercent: Number(
              settings.delivery.pickupDiscountPercent ?? 5
            ),
            showFreeDeliveryProgress:
              settings.delivery.showFreeDeliveryProgress === true,
            deliveryText: settings.delivery.deliveryText || "",
            pickupText: settings.delivery.pickupText || "",
            shopAddress: settings.delivery.shopAddress || "Мала Морська 108",
            shopLat: Number(settings.delivery.shopLat ?? 46.953807),
            shopLng: Number(settings.delivery.shopLng ?? 31.994199),
            deliveryZones: Array.isArray(settings.delivery.deliveryZones)
              ? settings.delivery.deliveryZones
              : [],
          });
        }
        if (settings?.payment) {
          setPaymentSettings({
            cardOnlineEnabled: settings.payment.cardOnlineEnabled === true,
            bankTransferEnabled: settings.payment.bankTransferEnabled === true,
            bankTransferCardNumber:
              settings.payment.bankTransferCardNumber || "",
            bankTransferRecipient: settings.payment.bankTransferRecipient || "",
            bankTransferBankName: settings.payment.bankTransferBankName || "",
            bankTransferHint: settings.payment.bankTransferHint || "",
          });
        }
        if (settings?.texts) {
          setSiteTexts({
            pickupSelectedText: settings.texts.pickupSelectedText || "",
            deliveryAddressHint: settings.texts.deliveryAddressHint || "",
            deliveryAddressNotFoundText:
              settings.texts.deliveryAddressNotFoundText || "",
            orderDisabledText: settings.texts.orderDisabledText || "",
            checkoutCommentPlaceholder:
              settings.texts.checkoutCommentPlaceholder || "",
            checkoutExactTimeLabel: settings.texts.checkoutExactTimeLabel || "",
            checkoutSuccessHint: settings.texts.checkoutSuccessHint || "",
          });
        }
      } catch (error) {
        console.error("LOAD WORKING HOURS ERROR:", error);
        setWorkingHoursError("Не вдалося завантажити робочі години");
      } finally {
        setWorkingHoursLoading(false);
      }
    };

    loadWorkingHoursSettings();
  }, []);

  async function saveSettings() {
    try {
      const res = await fetch(`${API_BASE}/site-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error();

      alert("Збережено");
    } catch (e) {
      console.error("SAVE SETTINGS ERROR", e);
      alert("Помилка збереження");
    }
  }

  async function loadProducts() {
    try {
      setProductsLoading(true);

      const data = await getProducts(true);
      console.log("LOADED PRODUCTS:", data);
      console.log(
        "HIDDEN PRODUCTS:",
        Array.isArray(data) ? data.filter((p) => p.isVisible === false) : data
      );

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError(err.message || "Не вдалося завантажити товари");
    } finally {
      setProductsLoading(false);
    }
  }
  const loadPromotionSettings = async () => {
    try {
      setPromotionLoading(true);

      const data = await getPromotionSettings();

      setPromotionSettings({
        discountPercent: Number(data.discountPercent ?? 25),
        triggerSum: Number(data.triggerSum ?? 600),
        isActive: data.isActive === true,
      });
    } catch (error) {
      console.error("LOAD PROMOTION SETTINGS ERROR:", error);
    } finally {
      setPromotionLoading(false);
    }
  };

  const loadGiftRollSettings = async () => {
    try {
      setGiftRollLoading(true);
      const data = await getGiftRollSettings();

      setGiftRollSettings({
        triggerSum: data?.triggerSum ?? 1000,
        giftProductId: data?.giftProductId ?? "",
        isActive: data?.isActive ?? true,
        weekdaysOnly: data?.weekdaysOnly ?? true,
      });
    } catch (error) {
      console.error("GIFT ROLL SETTINGS LOAD ERROR:", error);
    } finally {
      setGiftRollLoading(false);
    }
  };

  async function loadBanners() {
    try {
      setBannersLoading(true);
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setBannersLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) => {
        if (categoryFilter === "all") return true;
        return product.category === categoryFilter;
      })
      .filter((product) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        return (product.name || "")
          .toLowerCase()
          .includes(q)(product.description || "")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const pa = Number(a.priority ?? 10);
        const pb = Number(b.priority ?? 10);

        if (pa !== pb) return pa - pb;

        return (a.name || "").localeCompare(b.name || "", "uk");
      });
  }, [products, categoryFilter, search]);

  const rollProducts = products.filter((p) => {
    const category = p.category?.toLowerCase?.() || "";
    return category === "rolls" || category === "роллы";
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleWorkingHoursChange = (e) => {
    const { name, value, type, checked } = e.target;

    setWorkingHoursSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveWorkingHours = async () => {
    try {
      setWorkingHoursSaving(true);
      setWorkingHoursMessage("");
      setWorkingHoursError("");

      const payload = {
        openTime: workingHoursSettings.openTime,
        closeTime: workingHoursSettings.closeTime,
        closedToday: workingHoursSettings.closedToday === true,
        allowOrdersAfterHours:
          workingHoursSettings.allowOrdersAfterHours === true,
      };

      const result = await updateWorkingHours(payload);

      setWorkingHoursSettings({
        openTime: result.workingHours?.openTime || payload.openTime,
        closeTime: result.workingHours?.closeTime || payload.closeTime,
        closedToday: result.workingHours?.closedToday === true,
        allowOrdersAfterHours:
          result.workingHours?.allowOrdersAfterHours === true,
      });

      setWorkingHoursMessage("✅ Налаштування робочих годин збережено");
    } catch (error) {
      console.error("SAVE WORKING HOURS ERROR:", error);
      setWorkingHoursError(error.message || "Помилка збереження робочих годин");
    } finally {
      setWorkingHoursSaving(false);
    }
  };

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDeliveryError("");
    setDeliveryMessage("");

    setDeliverySettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleZoneChange = (index, field, value) => {
    setDeliveryError("");
    setDeliveryMessage("");

    setDeliverySettings((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map((zone, zoneIndex) =>
        zoneIndex === index
          ? {
              ...zone,
              [field]: value,
            }
          : zone
      ),
    }));
  };

  const handleAddZone = () => {
    setDeliverySettings((prev) => ({
      ...prev,
      deliveryZones: [...prev.deliveryZones, { maxKm: "", minOrder: "" }],
    }));
  };

  const handleRemoveZone = (index) => {
    setDeliverySettings((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter(
        (_, zoneIndex) => zoneIndex !== index
      ),
    }));
  };

  const handleContactsChange = (e) => {
    const { name, value } = e.target;

    setContactsError("");
    setContactsMessage("");

    setContactsSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDeliverySettings = async () => {
    try {
      setDeliverySaving(true);
      setDeliveryMessage("");
      setDeliveryError("");

      const payload = {
        deliveryEnabled: deliverySettings.deliveryEnabled === true,
        pickupEnabled: deliverySettings.pickupEnabled === true,
        pickupDiscountPercent: Number(
          deliverySettings.pickupDiscountPercent ?? 5
        ),
        showFreeDeliveryProgress:
          deliverySettings.showFreeDeliveryProgress === true,
        deliveryText: deliverySettings.deliveryText,
        pickupText: deliverySettings.pickupText,
        shopAddress: deliverySettings.shopAddress,
        shopLat: Number(deliverySettings.shopLat ?? 0),
        shopLng: Number(deliverySettings.shopLng ?? 0),
        deliveryZones: deliverySettings.deliveryZones.map((zone) => ({
          maxKm: Number(zone.maxKm),
          minOrder: Number(zone.minOrder),
        })),
      };

      const result = await updateDeliverySettings(payload);

      setDeliverySettings({
        deliveryEnabled: result.delivery?.deliveryEnabled === true,
        pickupEnabled: result.delivery?.pickupEnabled === true,
        pickupDiscountPercent: Number(
          result.delivery?.pickupDiscountPercent ?? 5
        ),
        showFreeDeliveryProgress:
          result.delivery?.showFreeDeliveryProgress === true,
        deliveryText: result.delivery?.deliveryText || "",
        pickupText: result.delivery?.pickupText || "",
        shopAddress: result.delivery?.shopAddress || "",
        shopLat: Number(result.delivery?.shopLat ?? 0),
        shopLng: Number(result.delivery?.shopLng ?? 0),
        deliveryZones: Array.isArray(result.delivery?.deliveryZones)
          ? result.delivery.deliveryZones
          : [],
      });

      setDeliveryMessage("✅ Налаштування доставки збережено");

      setTimeout(() => {
        setDeliveryMessage("");
      }, 2500);
    } catch (error) {
      console.error("SAVE DELIVERY SETTINGS ERROR:", error);
      setDeliveryError(
        error.message || "Помилка збереження налаштувань доставки"
      );
    } finally {
      setDeliverySaving(false);
    }
  };

  const handleSaveContactsSettings = async () => {
    try {
      setContactsSaving(true);
      setContactsMessage("");
      setContactsError("");

      const payload = {
        phonePrimary: contactsSettings.phonePrimary,
        phoneSecondary: contactsSettings.phoneSecondary,
        pickupAddress: contactsSettings.pickupAddress,
        mapLink: contactsSettings.mapLink,
        instagramLink: contactsSettings.instagramLink,
        telegramLink: contactsSettings.telegramLink,
        viberLink: contactsSettings.viberLink,
      };

      const result = await updateContactsSettings(payload);

      setContactsSettings({
        phonePrimary: result.contacts?.phonePrimary || "",
        phoneSecondary: result.contacts?.phoneSecondary || "",
        pickupAddress: result.contacts?.pickupAddress || "",
        mapLink: result.contacts?.mapLink || "",
        instagramLink: result.contacts?.instagramLink || "",
        telegramLink: result.contacts?.telegramLink || "",
        viberLink: result.contacts?.viberLink || "",
      });

      setContactsMessage("✅ Контакти збережено");

      setTimeout(() => {
        setContactsMessage("");
      }, 2500);
    } catch (error) {
      console.error("SAVE CONTACTS ERROR:", error);
      setContactsError(error.message || "Помилка збереження контактів");
    } finally {
      setContactsSaving(false);
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPaymentError("");
    setPaymentMessage("");

    setPaymentSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSavePaymentSettings = async () => {
    try {
      setPaymentSaving(true);
      setPaymentMessage("");
      setPaymentError("");

      const result = await updatePaymentSettings({
        cardOnlineEnabled: paymentSettings.cardOnlineEnabled === true,
        bankTransferEnabled: paymentSettings.bankTransferEnabled === true,
        bankTransferCardNumber: paymentSettings.bankTransferCardNumber,
        bankTransferRecipient: paymentSettings.bankTransferRecipient,
        bankTransferBankName: paymentSettings.bankTransferBankName,
        bankTransferHint: paymentSettings.bankTransferHint,
      });

      setPaymentSettings({
        cardOnlineEnabled: result.payment?.cardOnlineEnabled === true,
        bankTransferEnabled: result.payment?.bankTransferEnabled === true,
        bankTransferCardNumber: result.payment?.bankTransferCardNumber || "",
        bankTransferRecipient: result.payment?.bankTransferRecipient || "",
        bankTransferBankName: result.payment?.bankTransferBankName || "",
        bankTransferHint: result.payment?.bankTransferHint || "",
      });

      setPaymentMessage("✅ Налаштування оплати збережено");

      setTimeout(() => {
        setPaymentMessage("");
      }, 2500);
    } catch (error) {
      console.error("SAVE PAYMENT SETTINGS ERROR:", error);
      setPaymentError(error.message || "Помилка збереження налаштувань оплати");
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleSiteTextsChange = (e) => {
    const { name, value } = e.target;

    setSiteTextsError("");
    setSiteTextsMessage("");

    setSiteTexts((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSiteTexts = async () => {
    try {
      setSiteTextsSaving(true);
      setSiteTextsMessage("");
      setSiteTextsError("");

      const result = await updateSiteTexts(siteTexts);

      setSiteTexts({
        pickupSelectedText: result.texts?.pickupSelectedText || "",
        deliveryAddressHint: result.texts?.deliveryAddressHint || "",
        deliveryAddressNotFoundText:
          result.texts?.deliveryAddressNotFoundText || "",
        orderDisabledText: result.texts?.orderDisabledText || "",
        checkoutCommentPlaceholder:
          result.texts?.checkoutCommentPlaceholder || "",
        checkoutExactTimeLabel: result.texts?.checkoutExactTimeLabel || "",
        checkoutSuccessHint: result.texts?.checkoutSuccessHint || "",
      });

      setSiteTextsMessage("✅ Тексти сайту збережено");

      setTimeout(() => {
        setSiteTextsMessage("");
      }, 2500);
    } catch (error) {
      console.error("SAVE SITE TEXTS ERROR:", error);
      setSiteTextsError(error.message || "Помилка збереження текстів сайту");
    } finally {
      setSiteTextsSaving(false);
    }
  };

  const handlePopupChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPopupError("");
    setPopupMessage("");

    setPopupSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSavePopupSettings = async () => {
    try {
      setPopupSaving(true);
      setPopupMessage("");
      setPopupError("");

      const payload = {
        showOutsideWorkingHours: popupSettings.showOutsideWorkingHours === true,
        outsideHoursText: popupSettings.outsideHoursText,
        closedTodayText: popupSettings.closedTodayText,
      };

      const result = await updatePopupSettings(payload);

      setPopupSettings((prev) => ({
        ...prev,
        showOutsideWorkingHours: result.popup?.showOutsideWorkingHours === true,
        outsideHoursText: result.popup?.outsideHoursText || "",
        closedTodayText: result.popup?.closedTodayText || "",
      }));

      setPopupMessage("✅ Налаштування попапа збережено");

      setTimeout(() => {
        setPopupMessage("");
      }, 2500);
    } catch (error) {
      console.error("SAVE POPUP SETTINGS ERROR:", error);
      setPopupError(error.message || "Помилка збереження налаштувань попапа");
    } finally {
      setPopupSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0] || null;
    setImage(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview("");
    }
  };

  const handlePromotionChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPromotionSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveGiftRollSettings = async () => {
    try {
      setGiftRollSaving(true);
      setGiftRollMessage("");
      setGiftRollError("");

      await updateGiftRollSettings({
        triggerSum: Number(giftRollSettings.triggerSum) || 1000,
        giftProductId: giftRollSettings.giftProductId || null,
        isActive: giftRollSettings.isActive === true,
        weekdaysOnly: giftRollSettings.weekdaysOnly === true,
      });

      setGiftRollMessage("✅ Налаштування подарункового ролу збережено");
    } catch (error) {
      console.error("SAVE GIFT ROLL SETTINGS ERROR:", error);
      setGiftRollError(
        error.message || "Помилка збереження налаштувань подарункового ролу"
      );
    } finally {
      setGiftRollSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");
      if (!form.name?.trim()) {
        setMessage("Введи назву товару");
        return;
      }

      if (form.price === "" || form.price === null || Number(form.price) <= 0) {
        setMessage("Вкажи коректну ціну");
        return;
      }

      if (!form.category?.trim()) {
        setMessage("Обери категорію");
        return;
      }

      const formData = new FormData();

      formData.append("name", form.name?.trim() || "");
      formData.append("price", String(form.price || ""));
      formData.append("oldPrice", String(form.oldPrice || ""));
      formData.append("category", form.category || "");
      formData.append("description", form.description || "");
      formData.append("weight", form.weight || "");

      formData.append("popular", String(!!popular));
      formData.append("promoType", form.promoType || "none");
      formData.append("priority", String(form.priority || 10));
      formData.append(
        "rollType",
        form.category === "rolls" ? form.rollType || "" : ""
      );

      formData.append(
        "discountOfferEligible",
        String(!!form.discountOfferEligible)
      );

      formData.append("isVisible", String(!!form.isVisible));
      formData.append("isHit", String(!!form.isHit));
      formData.append("isNew", String(!!form.isNew));
      formData.append("isWeeklyOffer", String(!!form.isWeeklyOffer));

      formData.append("freeSoySauce", String(form.freeSoySauce || 0));
      formData.append("freeGinger", String(form.freeGinger || 0));
      formData.append("freeWasabi", String(form.freeWasabi || 0));

      if (image) {
        formData.append("image", image);
      }

      if (editingId) {
        const result = await updateProduct(editingId, formData);

        if (result?.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingId ? result.product : p))
          );
        }

        setMessage("✅ Товар оновлено");
      } else {
        const result = await createProduct(formData);

        if (result?.product) {
          setProducts((prev) => [result.product, ...prev]);
        }

        setMessage("✅ Товар додано");
      }

      setForm({
        name: "",
        price: "",
        oldPrice: "",
        category: "",
        description: "",
        weight: "",
        rollType: "",

        promoType: "none",
        priority: 10,
        discountOfferEligible: false,

        isVisible: true,
        isHit: false,
        isNew: false,
        isWeeklyOffer: false,

        freeSoySauce: 0,
        freeGinger: 0,
        freeWasabi: 0,
      });

      setPopular(false);
      setImage(null);
      setImagePreview("");
      setEditingId(null);

      const input = document.getElementById("product-image-input");
      if (input) {
        input.value = "";
      }

      await loadProducts();
    } catch (err) {
      console.error("HANDLE SUBMIT ERROR:", err);
      setError(err.message || "Помилка збереження товару");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromotionSettings = async (e) => {
    e.preventDefault();

    try {
      setPromotionSaving(true);
      setPromotionMessage("");
      setPromotionError("");

      const payload = {
        discountPercent: Number(promotionSettings.discountPercent) || 25,
        triggerSum: Number(promotionSettings.triggerSum) || 600,
        isActive: promotionSettings.isActive === true,
      };

      const result = await updatePromotionSettings(payload);

      setPromotionSettings({
        discountPercent: Number(result.discountPercent ?? 25),
        triggerSum: Number(result.triggerSum ?? 600),
        isActive: result.isActive === true,
      });

      setPromotionMessage("✅ Налаштування акції оновлено");
    } catch (error) {
      console.error("SAVE PROMOTION SETTINGS ERROR:", error);
      setPromotionError(
        error.message || "Помилка збереження налаштувань акції"
      );
    } finally {
      setPromotionSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Видалити цей товар?");

    if (!confirmed) return;

    try {
      setMessage("");
      await deleteProduct(id);
      setMessage("✅ Товар видалено");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    }
  };

  const handlePriorityChange = async (product, direction) => {
    try {
      const currentPriority = Number(product.priority ?? 10);

      let nextPriority = currentPriority;

      if (direction === "up") {
        nextPriority = Math.max(1, currentPriority - 1);
      }

      if (direction === "down") {
        nextPriority = Math.min(999, currentPriority + 1);
      }

      if (nextPriority === currentPriority) {
        return;
      }

      const formData = new FormData();
      formData.append("name", product.name || "");
      formData.append("price", String(product.price || ""));
      formData.append("oldPrice", String(product.oldPrice || ""));
      formData.append("category", product.category || "");
      formData.append("description", product.description || "");
      formData.append("weight", product.weight || "");

      formData.append("popular", String(!!product.popular));
      formData.append("promoType", product.promoType || "none");
      formData.append("priority", String(nextPriority));
      formData.append(
        "rollType",
        form.category === "rolls" ? form.rollType || "" : ""
      );

      formData.append(
        "discountOfferEligible",
        String(!!product.discountOfferEligible)
      );

      formData.append("isVisible", String(product.isVisible !== false));
      formData.append("isHit", String(!!product.isHit));
      formData.append("isNew", String(!!product.isNew));
      formData.append("isWeeklyOffer", String(!!product.isWeeklyOffer));

      formData.append("freeSoySauce", String(product.freeSoySauce || 0));
      formData.append("freeGinger", String(product.freeGinger || 0));
      formData.append("freeWasabi", String(product.freeWasabi || 0));

      await updateProduct(product.id, formData);

      setMessage(`✅ Пріоритет "${product.name}" змінено на ${nextPriority}`);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(error.message || "Не вдалося змінити пріоритет");
    }
  };

  const handleEdit = (product) => {
    setActiveSection("products");
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      category: product.category || "",
      description: product.description || "",
      weight: product.weight || "",
      rollType: product.rollType || "",

      promoType: product.promoType || "none",
      priority: Number(product.priority ?? 10),
      discountOfferEligible: product.discountOfferEligible ?? false,

      isVisible: product.isVisible !== false,
      isHit: product.isHit ?? false,
      isNew: product.isNew ?? false,
      isWeeklyOffer: product.isWeeklyOffer ?? false,

      freeSoySauce: product.freeSoySauce || 0,
      freeGinger: product.freeGinger || 0,
      freeWasabi: product.freeWasabi || 0,
    });

    setPopular(!!product.popular);
    setImage(null);
    setImagePreview(getImageUrl(product.image));
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);

    setForm({
      name: "",
      price: "",
      oldPrice: "",
      category: "",
      description: "",
      weight: "",
      rollType: "",

      promoType: "none",
      priority: 10,
      discountOfferEligible: false,

      isVisible: true,
      isHit: false,
      isNew: false,
      isWeeklyOffer: false,

      freeSoySauce: 0,
      freeGinger: 0,
      freeWasabi: 0,
    });

    setPopular(false);
    setImage(null);
    setImagePreview("");
    setMessage("");

    const fileInput = document.getElementById("image-input");
    if (fileInput) fileInput.value = "";
  };

  const handleBannerChange = (e) => {
    const { name, value, type, checked } = e.target;

    setBannerForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0] || null;
    setBannerImage(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    } else {
      setBannerPreview("");
    }
  };

  const handleBannerMobileFileChange = (e) => {
    const file = e.target.files[0] || null;
    setBannerMobileImage(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBannerMobilePreview(previewUrl);
    } else {
      setBannerMobilePreview("");
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("title", bannerForm.title);
      formData.append("link", bannerForm.link);
      formData.append("priority", bannerForm.priority);
      formData.append("isActive", bannerForm.isActive);
      formData.append("endAt", bannerForm.endAt || "");

      if (bannerImage) {
        formData.append("image", bannerImage);
      }

      if (bannerMobileImage) {
        formData.append("mobileImage", bannerMobileImage);
      }

      if (bannerEditingId) {
        await updateBanner(bannerEditingId, formData);
        setMessage("✅ Банер оновлено");
      } else {
        await createBanner(formData);
        setMessage("✅ Банер додано");
      }

      setBannerForm({
        title: "",
        link: "#menu",
        priority: 10,
        isActive: true,
        endAt: "",
      });

      setBannerImage(null);
      setBannerMobileImage(null);
      setBannerPreview("");
      setBannerMobilePreview("");
      setBannerEditingId(null);

      const fileInput = document.getElementById("banner-image-input");
      if (fileInput) fileInput.value = "";

      const mobileFileInput = document.getElementById(
        "banner-mobile-image-input"
      );
      if (mobileFileInput) mobileFileInput.value = "";

      await loadBanners();
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerEdit = (banner) => {
    setActiveSection("hero");
    setBannerEditingId(banner.id);

    setBannerForm({
      title: banner.title || "",
      link: banner.link || "#menu",
      priority: Number(banner.priority ?? 10),
      isActive: !!banner.isActive,
      endAt: banner.endAt
        ? new Date(banner.endAt).toISOString().slice(0, 16)
        : "",
    });

    setBannerImage(null);
    setBannerMobileImage(null);
    setBannerPreview(getImageUrl(banner.image));
    setBannerMobilePreview(
      banner.mobileImage ? getImageUrl(banner.mobileImage) : ""
    );
    setMessage("");
  };

  const handleBannerDragStart = (bannerId) => {
    setDragBannerId(bannerId);
  };

  const handleBannerDragOver = (e) => {
    e.preventDefault();
  };

  const handleBannerDrop = async (targetBannerId) => {
    try {
      if (!dragBannerId || dragBannerId === targetBannerId) {
        setDragBannerId(null);
        return;
      }

      const sorted = [...banners].sort(
        (a, b) => Number(a.priority ?? 10) - Number(b.priority ?? 10)
      );

      const fromIndex = sorted.findIndex((item) => item.id === dragBannerId);
      const toIndex = sorted.findIndex((item) => item.id === targetBannerId);

      if (fromIndex === -1 || toIndex === -1) {
        setDragBannerId(null);
        return;
      }

      const updated = [...sorted];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      const payload = updated.map((item, index) => ({
        id: item.id,
        priority: index + 1,
      }));

      await reorderBanners(payload);
      await loadBanners();

      setMessage("✅ Порядок банерів оновлено");
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setDragBannerId(null);
    }
  };

  const handleBannerDelete = async (id) => {
    const confirmed = window.confirm("Видалити цей банер?");

    if (!confirmed) return;

    try {
      setMessage("");
      await deleteBanner(id);
      setMessage("✅ Банер видалено");
      await loadBanners();
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: "#111827",
            color: "#fff",
            borderRadius: "24px",
            padding: "24px 18px",
            position: "sticky",
            top: "24px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                marginBottom: "6px",
              }}
            >
              Karakatizza
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "14px",
              }}
            >
              Панель керування сайтом
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {sidebarItems.map((item) => {
              const isActive = activeSection === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    background: isActive ? "#ef4444" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "28px",
              padding: "16px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "8px" }}>
              Швидка інформація
            </div>

            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
              Товарів у меню: <b style={{ color: "#fff" }}>{products.length}</b>
            </div>
          </div>
        </aside>

        <main style={{ display: "grid", gap: "24px" }}>
          {activeSection === "products" && (
            <>
              <section
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                }}
              >
                <h1
                  style={{
                    marginBottom: "10px",
                    fontSize: "34px",
                    fontWeight: 800,
                  }}
                >
                  {editingId ? "Редагування товару" : "Керування товарами"}
                </h1>

                <p style={{ color: "#667085", marginBottom: "24px" }}>
                  Додавай нові позиції, редагуй меню та керуй порядком показу
                </p>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "grid",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 220px 140px",
                      gap: "16px",
                      alignItems: "stretch",
                    }}
                  >
                    <input
                      type="text"
                      name="name"
                      placeholder="Назва товару"
                      value={form.name}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                    {products.isVisible === false && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#a94442",
                          background: "#fdecea",
                          padding: "4px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        Прихований
                      </span>
                    )}

                    <input
                      type="number"
                      name="price"
                      placeholder="Ціна"
                      value={form.price}
                      onChange={handleChange}
                      style={inputStyle}
                      min="0"
                    />

                    <input
                      type="number"
                      name="priority"
                      min="1"
                      max="10"
                      placeholder="Пріоритет 1-10"
                      value={form.priority}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 220px",
                      gap: "16px",
                      alignItems: "stretch",
                    }}
                  >
                    <input
                      type="text"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="Вага / об'єм (наприклад: 250 г, 500 мл, 32 шт)"
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      name="oldPrice"
                      value={form.oldPrice}
                      onChange={handleChange}
                      placeholder="Стара ціна (якщо є акція)"
                      min="0"
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
                      gap: "12px 20px",
                      alignItems: "center",
                      padding: "6px 0",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isVisible"
                        checked={!!form.isVisible}
                        onChange={handleChange}
                      />
                      Показувати в меню
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isHit"
                        checked={!!form.isHit}
                        onChange={handleChange}
                      />
                      Маячок HIT
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isNew"
                        checked={!!form.isNew}
                        onChange={handleChange}
                      />
                      Маячок NEW
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isWeeklyOffer"
                        checked={!!form.isWeeklyOffer}
                        onChange={handleChange}
                      />
                      Акція тижня
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="">Оберіть категорію</option>
                      <option value="rolls">Роли</option>
                      <option value="maki">Макі</option>
                      <option value="sets">Сети</option>
                      <option value="sushi">Суші</option>
                      <option value="sushi_burger">Суші бургер</option>
                      <option value="snacks">Салати / Закуски</option>
                      <option value="bowls">Суші боули</option>
                      <option value="drinks">Напої</option>
                      <option value="extras">Додатково</option>
                    </select>
                    {form.category === "rolls" && (
                      <div style={{ marginTop: "10px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: 600,
                          }}
                        >
                          Тип ролу
                        </label>

                        <select
                          name="rollType"
                          value={form.rollType || ""}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #ddd",
                            background: "#fff",
                            fontSize: "14px",
                          }}
                        >
                          <option value="">Без підтипу</option>
                          <option value="cold">Холодні</option>
                          <option value="fried">Смажені</option>
                          <option value="baked">Запечені</option>
                          <option value="rice_free">Без рису</option>
                        </select>
                      </div>
                    )}

                    <select
                      name="promoType"
                      value={form.promoType}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="none">Без акції</option>
                      <option value="2plus1">Акція 2+1</option>
                    </select>
                  </div>

                  <textarea
                    name="description"
                    placeholder="Опис товару"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "110px",
                      paddingTop: "14px",
                    }}
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "12px",
                      padding: "16px",
                      border: "1px solid #eee",
                      borderRadius: "16px",
                      background: "#fafafa",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!popular}
                        onChange={(e) => setPopular(e.target.checked)}
                      />
                      Хіт продажу
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="discountOfferEligible"
                        checked={!!form.discountOfferEligible}
                        onChange={handleChange}
                      />
                      Участвує в акції (знижка %)
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        Соєвий соус (безкоштовно)
                      </span>
                      <input
                        type="number"
                        name="freeSoySauce"
                        min="0"
                        value={form.freeSoySauce}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        Імбир (безкоштовно)
                      </span>
                      <input
                        type="number"
                        name="freeGinger"
                        min="0"
                        value={form.freeGinger}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        Васабі (безкоштовно)
                      </span>
                      <input
                        type="number"
                        name="freeWasabi"
                        min="0"
                        value={form.freeWasabi}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      padding: "16px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "16px",
                      background: "#fcfcfc",
                    }}
                  >
                    <input
                      id="product-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />

                    {imagePreview ? (
                      <div
                        style={{
                          width: "180px",
                          height: "180px",
                          borderRadius: "18px",
                          overflow: "hidden",
                          border: "1px solid #eee",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt="preview— доставка суші Каракатица"
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        border: "none",
                        borderRadius: "14px",
                        padding: "14px 22px",
                        background: loading ? "#f3b29c" : "#e56a45",
                        color: "#fff",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: loading ? "default" : "pointer",
                      }}
                    >
                      {loading
                        ? "Збереження..."
                        : editingId
                        ? "Оновити товар"
                        : "Додати товар"}
                    </button>

                    {editingId ? (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "14px",
                          padding: "14px 22px",
                          background: "#fff",
                          color: "#222",
                          fontSize: "16px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Скасувати редагування
                      </button>
                    ) : null}
                  </div>
                </form>

                {message && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "#f3f4f6",
                      fontWeight: 600,
                    }}
                  >
                    {message}
                  </div>
                )}
              </section>

              <section
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "18px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: 800,
                    }}
                  >
                    Список товарів
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Пошук по назві..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: "260px",
                      }}
                    />

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: "240px",
                      }}
                    >
                      {categoryOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {productsLoading ? (
                  <div style={{ color: "#667085", fontWeight: 600 }}>
                    Завантаження...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ color: "#667085", fontWeight: 600 }}>
                    Нічого не знайдено
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {filteredProducts.map((product) => {
                      const imageSrc = getImageUrl(product.image);

                      return (
                        <div
                          key={product.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "90px 1fr auto",
                            gap: "16px",
                            alignItems: "center",
                            border: "1px solid #eee",
                            borderRadius: "18px",
                            padding: "14px",
                          }}
                        >
                          <div>
                            {product.image ? (
                              <img
                                src={imageSrc}
                                alt={`${product.name}— доставка суші Каракатица`}
                                loading="lazy"
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  objectFit: "cover",
                                  borderRadius: "14px",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  borderRadius: "14px",
                                  background: "#f1f1f1",
                                }}
                              />
                            )}
                          </div>

                          <div>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                alignItems: "center",
                                marginBottom: "6px",
                              }}
                            >
                              <div
                                style={{ fontWeight: 800, fontSize: "18px" }}
                              >
                                {product.name}
                              </div>

                              <span style={badgeStyle("#f3f4f6", "#111827")}>
                                Пріоритет: {Number(product.priority ?? 10)}
                              </span>

                              {product.popular && (
                                <span style={badgeStyle("#fff7ed", "#ea580c")}>
                                  Хіт
                                </span>
                              )}

                              {product.promoType === "2plus1" && (
                                <span style={badgeStyle("#eff6ff", "#2563eb")}>
                                  2+1
                                </span>
                              )}
                            </div>

                            <div style={{ color: "#667085" }}>
                              {product.description || "Без опису"}
                            </div>

                            <div style={{ marginTop: "8px", fontWeight: 800 }}>
                              {product.price} грн
                            </div>

                            <div
                              style={{
                                marginTop: "4px",
                                color: "#98a2b3",
                                fontSize: "14px",
                              }}
                            >
                              Категорія: {product.category}
                            </div>
                          </div>

                          <div>
                            <div style={{ display: "grid", gap: "10px" }}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "8px",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePriorityChange(product, "up")
                                  }
                                  style={{
                                    background: "#f8fafc",
                                    color: "#111827",
                                    border: "1px solid #dbe2ea",
                                    borderRadius: "12px",
                                    padding: "10px 12px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                  title="Підняти вище"
                                >
                                  ↑ Вище
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePriorityChange(product, "down")
                                  }
                                  style={{
                                    background: "#f8fafc",
                                    color: "#111827",
                                    border: "1px solid #dbe2ea",
                                    borderRadius: "12px",
                                    padding: "10px 12px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                  title="Опустити нижче"
                                >
                                  ↓ Нижче
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                style={{
                                  background: "#eef4ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #c7d7fe",
                                  borderRadius: "12px",
                                  padding: "10px 14px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Редагувати
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                style={{
                                  background: "#fff1f1",
                                  color: "#c62828",
                                  border: "1px solid #f3c0c0",
                                  borderRadius: "12px",
                                  padding: "10px 14px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Видалити
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeSection === "hero" && (
            <>
              <section
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                }}
              >
                <h2
                  style={{
                    fontSize: "30px",
                    fontWeight: 800,
                    marginBottom: "12px",
                  }}
                >
                  Банери на головній
                </h2>

                <p
                  style={{
                    color: "#667085",
                    marginBottom: "24px",
                  }}
                >
                  Додавай desktop і mobile банери, таймери та посилання на
                  товари або категорії
                </p>

                <form
                  onSubmit={handleBannerSubmit}
                  style={{ display: "grid", gap: "16px" }}
                >
                  <input
                    type="text"
                    name="title"
                    placeholder="Назва банера (для себе)"
                    value={bannerForm.title}
                    onChange={handleBannerChange}
                    style={inputStyle}
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 180px 220px",
                      gap: "16px",
                    }}
                  >
                    <input
                      type="text"
                      name="link"
                      placeholder="Посилання: #menu, category:rolls, product:ID"
                      value={bannerForm.link}
                      onChange={handleBannerChange}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      name="priority"
                      min="1"
                      max="20"
                      value={bannerForm.priority}
                      onChange={handleBannerChange}
                      style={inputStyle}
                    />

                    <input
                      type="datetime-local"
                      name="endAt"
                      value={bannerForm.endAt}
                      onChange={handleBannerChange}
                      style={inputStyle}
                    />
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "14px 16px",
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={bannerForm.isActive}
                      onChange={handleBannerChange}
                    />
                    <span style={{ fontWeight: 700 }}>Показувати банер</span>
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <input
                      id="banner-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      style={inputStyle}
                    />

                    <input
                      id="banner-mobile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerMobileFileChange}
                      style={inputStyle}
                    />
                  </div>

                  {(bannerPreview || bannerMobilePreview) && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "18px",
                          border: "1px solid #eee",
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
                          Desktop банер
                        </div>

                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="desktop preview— доставка суші Каракатица"
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "140px",
                              objectFit: "cover",
                              borderRadius: "16px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: "140px",
                              borderRadius: "16px",
                              background: "#f1f1f1",
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "18px",
                          border: "1px solid #eee",
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
                          Mobile банер
                        </div>

                        {bannerMobilePreview ? (
                          <img
                            src={bannerMobilePreview}
                            alt="mobile preview— доставка суші Каракатица"
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "140px",
                              objectFit: "cover",
                              borderRadius: "16px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: "140px",
                              borderRadius: "16px",
                              background: "#f1f1f1",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      style={primaryButtonStyle}
                    >
                      {loading
                        ? "Збереження..."
                        : bannerEditingId
                        ? "Зберегти банер"
                        : "Додати банер"}
                    </button>

                    {bannerEditingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setBannerEditingId(null);
                          setBannerImage(null);
                          setBannerMobileImage(null);
                          setBannerPreview("");
                          setBannerMobilePreview("");
                          setBannerForm({
                            title: "",
                            link: "#menu",
                            priority: 10,
                            isActive: true,
                            endAt: "",
                          });

                          const fileInput =
                            document.getElementById("banner-image-input");
                          if (fileInput) fileInput.value = "";

                          const mobileFileInput = document.getElementById(
                            "banner-mobile-image-input"
                          );
                          if (mobileFileInput) mobileFileInput.value = "";
                        }}
                        style={secondaryButtonStyle}
                      >
                        Скасувати редагування
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                }}
              >
                <h3
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    marginBottom: "18px",
                  }}
                >
                  Список банерів
                </h3>

                {bannersLoading ? (
                  <div style={{ color: "#667085", fontWeight: 600 }}>
                    Завантаження...
                  </div>
                ) : banners.length === 0 ? (
                  <div style={{ color: "#667085", fontWeight: 600 }}>
                    Банерів поки немає
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {[...banners]
                      .sort(
                        (a, b) =>
                          Number(a.priority ?? 10) - Number(b.priority ?? 10)
                      )
                      .map((banner) => (
                        <div
                          key={banner.id}
                          draggable
                          onDragStart={() => handleBannerDragStart(banner.id)}
                          onDragOver={handleBannerDragOver}
                          onDrop={() => handleBannerDrop(banner.id)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "220px 140px 1fr auto",
                            gap: "16px",
                            alignItems: "center",
                            border:
                              dragBannerId === banner.id
                                ? "2px dashed #ef4444"
                                : "1px solid #eee",
                            borderRadius: "18px",
                            padding: "14px",
                            background:
                              dragBannerId === banner.id ? "#fff5f5" : "#fff",
                            cursor: "grab",
                          }}
                        >
                          <img
                            src={getImageUrl(banner.image)}
                            alt={`${banner.title}— доставка суші Каракатица`}
                            loading="lazy"
                            style={{
                              width: "220px",
                              height: "110px",
                              objectFit: "cover",
                              borderRadius: "14px",
                            }}
                          />

                          {banner.mobileImage ? (
                            <img
                              src={getImageUrl(banner.mobileImage)}
                              alt="mobile banner— доставка суші Каракатица"
                              loading="lazy"
                              style={{
                                width: "140px",
                                height: "110px",
                                objectFit: "cover",
                                borderRadius: "14px",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "140px",
                                height: "110px",
                                borderRadius: "14px",
                                background: "#f1f1f1",
                              }}
                            />
                          )}

                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "18px",
                                marginBottom: "6px",
                              }}
                            >
                              {banner.title || "Без назви"}
                            </div>

                            <div
                              style={{ color: "#667085", marginBottom: "6px" }}
                            >
                              Посилання: {banner.link || "#menu"}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "6px",
                              }}
                            >
                              <span style={badgeStyle("#f3f4f6", "#111827")}>
                                Пріоритет: {Number(banner.priority ?? 10)}
                              </span>

                              <span
                                style={badgeStyle(
                                  banner.isActive ? "#ecfdf3" : "#fef2f2",
                                  banner.isActive ? "#027a48" : "#b42318"
                                )}
                              >
                                {banner.isActive ? "Активний" : "Вимкнений"}
                              </span>

                              <span style={badgeStyle("#eff6ff", "#2563eb")}>
                                Кліки: {Number(banner.clickCount ?? 0)}
                              </span>
                            </div>

                            {banner.endAt && (
                              <div
                                style={{ color: "#667085", fontSize: "14px" }}
                              >
                                Таймер до:{" "}
                                {new Date(banner.endAt).toLocaleString("uk-UA")}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "grid", gap: "10px" }}>
                            <button
                              type="button"
                              onClick={() => handleBannerEdit(banner)}
                              style={{
                                background: "#eef4ff",
                                color: "#1d4ed8",
                                border: "1px solid #c7d7fe",
                                borderRadius: "12px",
                                padding: "10px 14px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Редагувати
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBannerDelete(banner.id)}
                              style={{
                                background: "#fff1f1",
                                color: "#c62828",
                                border: "1px solid #f3c0c0",
                                borderRadius: "12px",
                                padding: "10px 14px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Видалити
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeSection === "promos" && (
            <section
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  fontSize: "36px",
                  fontWeight: 800,
                }}
              >
                Налаштування акції знижка
              </h2>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: "24px",
                  color: "#666",
                  fontSize: "16px",
                }}
              >
                Окремо налаштовується акція “ролл зі знижкою” для кошика.
              </p>

              <form onSubmit={handleSavePromotionSettings}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <input
                    type="number"
                    name="triggerSum"
                    min="1"
                    placeholder="Сума спрацювання"
                    value={promotionSettings.triggerSum}
                    onChange={handlePromotionChange}
                    style={inputStyle}
                  />

                  <input
                    type="number"
                    name="discountPercent"
                    min="1"
                    max="100"
                    placeholder="Знижка %"
                    value={promotionSettings.discountPercent}
                    onChange={handlePromotionChange}
                    style={inputStyle}
                  />
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "20px",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={promotionSettings.isActive}
                    onChange={handlePromotionChange}
                  />
                  Акція активна
                </label>

                <button
                  type="submit"
                  disabled={promotionSaving || promotionLoading}
                  style={{
                    border: "none",
                    background: "#e56a45",
                    color: "#fff",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: promotionSaving || promotionLoading ? 0.7 : 1,
                  }}
                >
                  {promotionSaving ? "Зберігаємо..." : "Зберегти налаштування"}
                </button>
              </form>
              {promotionMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#ecfdf3",
                    color: "#166534",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {promotionMessage}
                </div>
              )}

              {promotionError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {promotionError}
                </div>
              )}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "20px",
                  marginTop: "20px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ marginBottom: "16px" }}>Подарунковий рол</h3>

                <p style={{ color: "#666", marginBottom: "16px" }}>
                  Від заданої суми в кошику автоматично додається подарунковий
                  рол. Акція може працювати тільки у будні.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <input
                    type="number"
                    placeholder="Сума спрацювання"
                    value={giftRollSettings.triggerSum}
                    onChange={(e) =>
                      setGiftRollSettings((prev) => ({
                        ...prev,
                        triggerSum: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />

                  <select
                    value={giftRollSettings.giftProductId}
                    onChange={(e) =>
                      setGiftRollSettings((prev) => ({
                        ...prev,
                        giftProductId: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Оберіть рол для подарунка</option>
                    {rollProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={giftRollSettings.isActive}
                    onChange={(e) =>
                      setGiftRollSettings((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Акція активна
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "18px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={giftRollSettings.weekdaysOnly}
                    onChange={(e) =>
                      setGiftRollSettings((prev) => ({
                        ...prev,
                        weekdaysOnly: e.target.checked,
                      }))
                    }
                  />
                  Лише з понеділка по четвер
                </label>

                <button
                  type="button"
                  onClick={handleSaveGiftRollSettings}
                  disabled={giftRollSaving}
                  style={{
                    border: "none",
                    background: "#e56a45",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "12px 18px",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: giftRollSaving ? 0.7 : 1,
                  }}
                >
                  {giftRollSaving ? "Збереження..." : "Зберегти налаштування"}
                </button>
              </div>
              {giftRollMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#ecfdf3",
                    color: "#166534",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {giftRollMessage}
                </div>
              )}

              {giftRollError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {giftRollError}
                </div>
              )}
            </section>
          )}

          {activeSection === "settings" && (
            <div
              style={{
                display: "grid",
                gap: "20px",
                maxWidth: "900px",
              }}
            >
              <section style={settingsCardStyle}>
                <h2 style={settingsTitleStyle}>Робочі години</h2>
                <p style={settingsDescStyle}>
                  Керування графіком роботи сайту та прийомом замовлень.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginTop: "20px",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 600,
                        color: "#222",
                      }}
                    >
                      Відкриття
                    </label>
                    <input
                      type="time"
                      name="openTime"
                      value={workingHoursSettings.openTime}
                      onChange={handleWorkingHoursChange}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 600,
                        color: "#222",
                      }}
                    >
                      Закриття
                    </label>
                    <input
                      type="time"
                      name="closeTime"
                      value={workingHoursSettings.closeTime}
                      onChange={handleWorkingHoursChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                    fontWeight: 600,
                    color: "#222",
                  }}
                >
                  <input
                    type="checkbox"
                    name="closedToday"
                    checked={workingHoursSettings.closedToday}
                    onChange={handleWorkingHoursChange}
                  />
                  Закрито сьогодні
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "20px",
                    fontWeight: 600,
                    color: "#222",
                  }}
                >
                  <input
                    type="checkbox"
                    name="allowOrdersAfterHours"
                    checked={workingHoursSettings.allowOrdersAfterHours}
                    onChange={handleWorkingHoursChange}
                  />
                  Приймати замовлення поза графіком
                </label>

                <button
                  type="button"
                  onClick={handleSaveWorkingHours}
                  disabled={workingHoursSaving}
                  style={{
                    border: "none",
                    background: "#e56a45",
                    color: "#fff",
                    borderRadius: "14px",
                    padding: "14px 22px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: workingHoursSaving ? 0.7 : 1,
                  }}
                >
                  {workingHoursSaving
                    ? "Збереження..."
                    : "Зберегти налаштування"}
                </button>

                {workingHoursMessage && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "#ecfdf3",
                      color: "#166534",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {workingHoursMessage}
                  </div>
                )}

                {workingHoursError && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {workingHoursError}
                  </div>
                )}
              </section>

              <section style={settingsCardStyle}>
                <section style={settingsCardStyle}>
                  <h2 style={settingsTitleStyle}>Попап</h2>
                  <p style={settingsDescStyle}>
                    Повідомлення для клієнта поза робочим часом або коли заклад
                    зачинений.
                  </p>

                  <div style={{ marginTop: "20px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "12px",
                        fontWeight: 600,
                        color: "#222",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="showOutsideWorkingHours"
                        checked={popupSettings.showOutsideWorkingHours}
                        onChange={handlePopupChange}
                      />
                      Показувати поза робочим часом
                    </label>

                    <textarea
                      name="outsideHoursText"
                      value={popupSettings.outsideHoursText}
                      onChange={handlePopupChange}
                      placeholder="Текст для повідомлення поза робочим часом"
                      style={{
                        ...inputStyle,
                        minHeight: "90px",
                        resize: "vertical",
                        marginBottom: "14px",
                      }}
                    />

                    <textarea
                      name="closedTodayText"
                      value={popupSettings.closedTodayText}
                      onChange={handlePopupChange}
                      placeholder="Текст для повідомлення коли сьогодні зачинено"
                      style={{
                        ...inputStyle,
                        minHeight: "90px",
                        resize: "vertical",
                        marginBottom: "18px",
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleSavePopupSettings}
                      disabled={popupSaving}
                      style={{
                        border: "none",
                        background: "#e56a45",
                        color: "#fff",
                        borderRadius: "14px",
                        padding: "14px 22px",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: popupSaving ? 0.7 : 1,
                      }}
                    >
                      {popupSaving ? "Збереження..." : "Зберегти налаштування"}
                    </button>

                    {popupMessage && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "#ecfdf3",
                          color: "#166534",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {popupMessage}
                      </div>
                    )}

                    {popupError && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {popupError}
                      </div>
                    )}
                  </div>
                </section>
              </section>

              <section style={settingsCardStyle}>
                <section style={settingsCardStyle}>
                  <h2 style={settingsTitleStyle}>Контакти</h2>
                  <p style={settingsDescStyle}>
                    Телефони, адреса самовивозу та посилання на соцмережі.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginTop: "20px",
                      marginBottom: "16px",
                    }}
                  >
                    <input
                      type="text"
                      name="phonePrimary"
                      placeholder="Основний телефон"
                      value={contactsSettings.phonePrimary}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="phoneSecondary"
                      placeholder="Другий телефон"
                      value={contactsSettings.phoneSecondary}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <input
                      type="text"
                      name="pickupAddress"
                      placeholder="Адреса самовивозу"
                      value={contactsSettings.pickupAddress}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <input
                      type="text"
                      name="mapLink"
                      placeholder="Посилання на гео"
                      value={contactsSettings.mapLink}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "16px",
                      marginBottom: "18px",
                    }}
                  >
                    <input
                      type="text"
                      name="instagramLink"
                      placeholder="Instagram"
                      value={contactsSettings.instagramLink}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="telegramLink"
                      placeholder="Telegram"
                      value={contactsSettings.telegramLink}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="viberLink"
                      placeholder="Viber"
                      value={contactsSettings.viberLink}
                      onChange={handleContactsChange}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveContactsSettings}
                    disabled={contactsSaving}
                    style={{
                      border: "none",
                      background: "#e56a45",
                      color: "#fff",
                      borderRadius: "14px",
                      padding: "14px 22px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: contactsSaving ? 0.7 : 1,
                    }}
                  >
                    {contactsSaving ? "Збереження..." : "Зберегти контакти"}
                  </button>

                  {contactsMessage && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#ecfdf3",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {contactsMessage}
                    </div>
                  )}

                  {contactsError && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {contactsError}
                    </div>
                  )}
                </section>
              </section>

              <section style={settingsCardStyle}>
                <section style={settingsCardStyle}>
                  <h2 style={settingsTitleStyle}>Доставка та самовивіз</h2>
                  <p style={settingsDescStyle}>
                    Основні параметри доставки, самовивозу та зон
                    обслуговування.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginTop: "20px",
                      marginBottom: "18px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="deliveryEnabled"
                        checked={deliverySettings.deliveryEnabled}
                        onChange={handleDeliveryChange}
                      />
                      Доставка активна
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="pickupEnabled"
                        checked={deliverySettings.pickupEnabled}
                        onChange={handleDeliveryChange}
                      />
                      Самовивіз активний
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <label>
                      <p>Знижка самовивозу</p>
                      <input
                        type="number"
                        name="pickupDiscountPercent"
                        placeholder="Знижка на самовивіз %"
                        value={deliverySettings.pickupDiscountPercent}
                        onChange={handleDeliveryChange}
                        style={inputStyle}
                      />
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                        paddingTop: "12px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="showFreeDeliveryProgress"
                        checked={deliverySettings.showFreeDeliveryProgress}
                        onChange={handleDeliveryChange}
                      />
                      Показувати шкалу безкоштовної доставки
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <input
                      type="text"
                      name="shopAddress"
                      placeholder="Адреса магазину"
                      value={deliverySettings.shopAddress}
                      onChange={handleDeliveryChange}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      step="any"
                      name="shopLat"
                      placeholder="Широта"
                      value={deliverySettings.shopLat}
                      onChange={handleDeliveryChange}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      step="any"
                      name="shopLng"
                      placeholder="Довгота"
                      value={deliverySettings.shopLng}
                      onChange={handleDeliveryChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <textarea
                      name="deliveryText"
                      value={deliverySettings.deliveryText}
                      onChange={handleDeliveryChange}
                      placeholder="Текст для доставки"
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <textarea
                      name="pickupText"
                      value={deliverySettings.pickupText}
                      onChange={handleDeliveryChange}
                      placeholder="Текст для самовивозу"
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      marginBottom: "14px",
                      fontWeight: 700,
                      fontSize: "18px",
                    }}
                  >
                    Зони доставки
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    {deliverySettings.deliveryZones.map((zone, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          step="any"
                          placeholder="Макс. км"
                          value={zone.maxKm}
                          onChange={(e) =>
                            handleZoneChange(index, "maxKm", e.target.value)
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          placeholder="Мін. сума замовлення"
                          value={zone.minOrder}
                          onChange={(e) =>
                            handleZoneChange(index, "minOrder", e.target.value)
                          }
                          style={inputStyle}
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveZone(index)}
                          style={{
                            border: "none",
                            background: "#f3f4f6",
                            color: "#b91c1c",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Видалити
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddZone}
                    style={{
                      border: "1px solid #ddd",
                      background: "#fff",
                      color: "#222",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: "20px",
                    }}
                  >
                    + Додати зону
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={handleSaveDeliverySettings}
                      disabled={deliverySaving}
                      style={{
                        border: "none",
                        background: "#e56a45",
                        color: "#fff",
                        borderRadius: "14px",
                        padding: "14px 22px",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: deliverySaving ? 0.7 : 1,
                      }}
                    >
                      {deliverySaving
                        ? "Збереження..."
                        : "Зберегти налаштування"}
                    </button>
                  </div>

                  {deliveryMessage && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#ecfdf3",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {deliveryMessage}
                    </div>
                  )}

                  {deliveryError && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {deliveryError}
                    </div>
                  )}
                </section>
              </section>

              <section style={settingsCardStyle}>
                <section style={settingsCardStyle}>
                  <h2 style={settingsTitleStyle}>Оплата</h2>
                  <p style={settingsDescStyle}>
                    Керування доступними способами оплати та режимом переказу на
                    карту.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                      marginTop: "20px",
                      marginBottom: "18px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="cardOnlineEnabled"
                        checked={paymentSettings.cardOnlineEnabled}
                        onChange={handlePaymentChange}
                      />
                      Оплата карткою онлайн доступна
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="bankTransferEnabled"
                        checked={paymentSettings.bankTransferEnabled}
                        onChange={handlePaymentChange}
                      />
                      Показувати “Переказ на карту”
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <input
                      type="text"
                      name="bankTransferCardNumber"
                      placeholder="Номер картки"
                      value={paymentSettings.bankTransferCardNumber}
                      onChange={handlePaymentChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="bankTransferRecipient"
                      placeholder="Отримувач"
                      value={paymentSettings.bankTransferRecipient}
                      onChange={handlePaymentChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="bankTransferBankName"
                      placeholder="Банк"
                      value={paymentSettings.bankTransferBankName}
                      onChange={handlePaymentChange}
                      style={inputStyle}
                    />

                    <textarea
                      name="bankTransferHint"
                      placeholder="Підказка для клієнта"
                      value={paymentSettings.bankTransferHint}
                      onChange={handlePaymentChange}
                      style={{
                        ...inputStyle,
                        minHeight: "90px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePaymentSettings}
                    disabled={paymentSaving}
                    style={{
                      border: "none",
                      background: "#e56a45",
                      color: "#fff",
                      borderRadius: "14px",
                      padding: "14px 22px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: paymentSaving ? "default" : "pointer",
                      opacity: paymentSaving ? 0.7 : 1,
                    }}
                  >
                    {paymentSaving ? "Збереження..." : "Зберегти налаштування"}
                  </button>

                  {paymentMessage && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#ecfdf3",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {paymentMessage}
                    </div>
                  )}

                  {paymentError && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {paymentError}
                    </div>
                  )}
                </section>
              </section>

              <section style={settingsCardStyle}>
                <section style={settingsCardStyle}>
                  <h2 style={settingsTitleStyle}>Тексти сайту</h2>
                  <p style={settingsDescStyle}>
                    Системні тексти для кошика, оформлення та службових
                    повідомлень.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                      marginTop: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <textarea
                      name="pickupSelectedText"
                      placeholder="Текст для самовивозу"
                      value={siteTexts.pickupSelectedText}
                      onChange={handleSiteTextsChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />

                    <textarea
                      name="deliveryAddressHint"
                      placeholder="Підказка для введення адреси"
                      value={siteTexts.deliveryAddressHint}
                      onChange={handleSiteTextsChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />

                    <textarea
                      name="deliveryAddressNotFoundText"
                      placeholder="Текст коли адресу не знайдено"
                      value={siteTexts.deliveryAddressNotFoundText}
                      onChange={handleSiteTextsChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />

                    <textarea
                      name="orderDisabledText"
                      placeholder="Текст коли оформлення недоступне"
                      value={siteTexts.orderDisabledText}
                      onChange={handleSiteTextsChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />

                    <input
                      type="text"
                      name="checkoutCommentPlaceholder"
                      placeholder="Плейсхолдер коментаря"
                      value={siteTexts.checkoutCommentPlaceholder}
                      onChange={handleSiteTextsChange}
                      style={inputStyle}
                    />

                    <input
                      type="text"
                      name="checkoutExactTimeLabel"
                      placeholder="Підпис для точного часу"
                      value={siteTexts.checkoutExactTimeLabel}
                      onChange={handleSiteTextsChange}
                      style={inputStyle}
                    />

                    <textarea
                      name="checkoutSuccessHint"
                      placeholder="Текст після оформлення замовлення"
                      value={siteTexts.checkoutSuccessHint}
                      onChange={handleSiteTextsChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSiteTexts}
                    disabled={siteTextsSaving}
                    style={{
                      border: "none",
                      background: "#e56a45",
                      color: "#fff",
                      borderRadius: "14px",
                      padding: "14px 22px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: siteTextsSaving ? "default" : "pointer",
                      opacity: siteTextsSaving ? 0.7 : 1,
                    }}
                  >
                    {siteTextsSaving ? "Збереження..." : "Зберегти тексти"}
                  </button>

                  {siteTextsMessage && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#ecfdf3",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {siteTextsMessage}
                    </div>
                  )}

                  {siteTextsError && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {siteTextsError}
                    </div>
                  )}
                </section>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PlaceholderCard({ title, text }) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "32px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          fontSize: "30px",
          fontWeight: 800,
          marginBottom: "12px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#667085",
          fontSize: "16px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </section>
  );
}

function badgeStyle(bg, color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: 800,
  };
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  padding: "14px 20px",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#f3f4f6",
  color: "#111827",
  border: "none",
  borderRadius: "14px",
  padding: "14px 20px",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
};
