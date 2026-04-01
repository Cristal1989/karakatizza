import { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  getCustomerOrders,
  sendTelegramBroadcast,
  sendTelegramMessageToOne,
  getTelegramBroadcastCount,
  getTelegramBroadcastHistory,
} from "../api/crmApi";
import { useSiteSettings } from "../context/SiteSettingsContext";

function formatDate(dateString) {
  if (!dateString) return "—";

  try {
    return new Date(dateString).toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `${number.toFixed(0)} грн`;
}

function getDaysSince(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

function getCustomerSegment(customer) {
  const daysSinceLastOrder = getDaysSince(customer.last_order_at);
  const ordersCount = Number(customer.orders_count || 0);

  if (daysSinceLastOrder !== null && daysSinceLastOrder >= 60) {
    return {
      label: "60+ днів",
      background: "#fef2f2",
      color: "#991b1b",
    };
  }

  if (daysSinceLastOrder !== null && daysSinceLastOrder >= 30) {
    return {
      label: "30+ днів",
      background: "#fff7ed",
      color: "#9a3412",
    };
  }

  if (ordersCount > 1) {
    return {
      label: "Повторний",
      background: "#ecfdf5",
      color: "#166534",
    };
  }

  return {
    label: "Новий",
    background: "#eef2ff",
    color: "#3730a3",
  };
}

function getPaymentLabel(paymentMethod) {
  if (paymentMethod === "card") return "Картка онлайн";
  if (paymentMethod === "bank_transfer") return "Переказ на карту";
  return "Готівка";
}

function getModeLabel(mode) {
  if (mode === "pickup") return "Самовивіз";
  return "Доставка";
}

function getModeBadgeStyle(mode) {
  if (mode === "pickup") {
    return {
      background: "#eef2ff",
      color: "#3730a3",
    };
  }

  return {
    background: "#ecfdf5",
    color: "#166534",
  };
}

function getPaymentBadgeStyle(paymentMethod) {
  if (paymentMethod === "card") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (paymentMethod === "bank_transfer") {
    return {
      background: "#fff7ed",
      color: "#9a3412",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
  };
}

export default function CustomersPage() {
  const { siteSettings } = useSiteSettings();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrdersId, setLoadingOrdersId] = useState(null);
  const [error, setError] = useState("");

  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState({});
  const customersLoading = loading;
  const customersError = error;
  const customerOrdersLoading = loadingOrdersId === expandedCustomerId;
  const customerOrders = expandedCustomerId
    ? ordersByCustomer[expandedCustomerId] || []
    : [];

  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("all");
  const [telegram, setTelegram] = useState("all");
  const [inactiveDays, setInactiveDays] = useState("");

  const [copyMessage, setCopyMessage] = useState("");

  const [minTotalSpent, setMinTotalSpent] = useState("");
  const [minLastOrderAmount, setMinLastOrderAmount] = useState("");

  const [telegramMessage, setTelegramMessage] = useState("");
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState("");

  const [showTelegramConfirm, setShowTelegramConfirm] = useState(false);

  const [telegramRecipientsCount, setTelegramRecipientsCount] = useState(0);
  const [telegramCounting, setTelegramCounting] = useState(false);

  const [telegramHistory, setTelegramHistory] = useState([]);
  const [telegramHistoryLoading, setTelegramHistoryLoading] = useState(false);
  const [telegramHistoryError, setTelegramHistoryError] = useState("");

  const [showTelegramComposer, setShowTelegramComposer] = useState(true);
  const [showTelegramHistory, setShowTelegramHistory] = useState(false);
  const [showCustomersList, setShowCustomersList] = useState(true);

  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  const telegramTemplates = [
    {
      key: "come-back-30",
      label: "30+ днів без замовлення",
      text:
        siteSettings?.telegramTemplates?.comeBack30 ||
        `Привіт, {{name}}!
  
  Скучили за тобою 🙂
  Повернись за улюбленими ролами — для тебе вже є привід оформити нове замовлення.`,
    },
    {
      key: "week-promo",
      label: "Акція тижня",
      text:
        siteSettings?.telegramTemplates?.weekPromo ||
        `Привіт, {{name}}!
  
  У нас зараз діє вигідна пропозиція тижня.
  Зазирни на сайт та обери щось смачне для себе 👌`,
    },
    {
      key: "vip",
      label: "Топ-клієнтам",
      text:
        siteSettings?.telegramTemplates?.vip ||
        `Привіт, {{name}}!
  
  Дякуємо, що замовляєш у Karakatizza 🍣
  
  Для наших постійних клієнтів ми готуємо особливі пропозиції.`,
    },
    {
      key: "new-menu",
      label: "Новинки меню",
      text:
        siteSettings?.telegramTemplates?.newMenu ||
        `Привіт, {{name}}!
  
  У меню з'явилися новинки.
  Саме час спробувати щось нове до вечері 😉`,
    },
    {
      key: "inactive-60",
      label: "60+ днів тиша",
      text:
        siteSettings?.telegramTemplates?.inactive60 ||
        `Привіт, {{name}}!
  
  Давно тебе не бачили в Karakatizza.
  Можливо, саме сьогодні час повернутися за улюбленими ролами 🍣`,
    },
  ];

  const collapseButtonStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#fff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  async function loadCustomers(overrides = {}) {
    try {
      setLoading(true);
      setError("");

      const params = {
        search,
        orderType,
        telegram,
        inactiveDays,
        minTotalSpent,
        minLastOrderAmount,
        ...overrides,
      };

      const data = await getCustomers(params);

      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message || "Помилка завантаження клієнтів");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    loadTelegramBroadcastHistory();
  }, []);

  const loadTelegramBroadcastHistory = async () => {
    try {
      setTelegramHistoryLoading(true);
      setTelegramHistoryError("");

      const result = await getTelegramBroadcastHistory(10);

      setTelegramHistory(result?.items || []);
    } catch (error) {
      setTelegramHistoryError(
        error?.message || "Не вдалося завантажити історію розсилок"
      );
    } finally {
      setTelegramHistoryLoading(false);
    }
  };

  async function handleApplyFilters() {
    await loadCustomers();
  }

  function getQuickFilterStyle(filterKey, baseStyles = {}, activeStyles = {}) {
    const isActive = activeQuickFilter === filterKey;

    return {
      border: "none",
      borderRadius: "12px",
      padding: "10px 14px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.18s ease",
      ...baseStyles,
      ...(isActive ? activeStyles : {}),
    };
  }

  async function handleCopyPhones() {
    try {
      const phones = customers
        .map((customer) => customer.phone_normalized || customer.phone || "")
        .filter(Boolean)
        .join("\n");

      if (!phones) {
        setCopyMessage("Немає телефонів для копіювання");
        setTimeout(() => setCopyMessage(""), 2000);
        return;
      }

      await navigator.clipboard.writeText(phones);

      setCopyMessage("Телефони скопійовано");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (err) {
      setCopyMessage("Не вдалося скопіювати");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  async function handleCopySinglePhone(phone) {
    try {
      if (!phone) {
        setCopyMessage("Немає телефону");
        setTimeout(() => setCopyMessage(""), 2000);
        return;
      }

      await navigator.clipboard.writeText(phone);

      setCopyMessage(`Скопійовано: ${phone}`);
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (err) {
      setCopyMessage("Не вдалося скопіювати номер");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  async function handleCopyCustomerList() {
    try {
      const listText = customers
        .map((customer) => {
          const name = customer.name || "Без імені";
          const phone = customer.phone || customer.phone_normalized || "";
          return phone ? `${name} — ${phone}` : `${name}`;
        })
        .join("\n");

      if (!listText.trim()) {
        setCopyMessage("Список порожній");
        setTimeout(() => setCopyMessage(""), 2000);
        return;
      }

      await navigator.clipboard.writeText(listText);

      setCopyMessage("Список скопійовано");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (err) {
      setCopyMessage("Не вдалося скопіювати список");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }
  async function applyQuickFilter(type) {
    let nextSearch = search;
    let nextOrderType = orderType;
    let nextTelegram = telegram;
    let nextInactiveDays = inactiveDays;
    let nextMinTotalSpent = minTotalSpent;
    let nextMinLastOrderAmount = minLastOrderAmount;

    if (type === "all") {
      nextSearch = "";
      nextOrderType = "all";
      nextTelegram = "all";
      nextInactiveDays = "";
      nextMinTotalSpent = "";
      nextMinLastOrderAmount = "";
    }

    if (type === "first") {
      nextOrderType = "first";
      nextInactiveDays = "";
    }

    if (type === "repeat") {
      nextOrderType = "repeat";
      nextInactiveDays = "";
    }

    if (type === "inactive30") {
      nextOrderType = "all";
      nextInactiveDays = "30";
    }

    if (type === "inactive60") {
      nextOrderType = "all";
      nextInactiveDays = "60";
    }

    setActiveQuickFilter(type);
    setMinTotalSpent(nextMinTotalSpent);
    setMinLastOrderAmount(nextMinLastOrderAmount);
    setSearch(nextSearch);
    setOrderType(nextOrderType);
    setTelegram(nextTelegram);
    setInactiveDays(nextInactiveDays);

    await loadCustomers({
      search: nextSearch,
      orderType: nextOrderType,
      telegram: nextTelegram,
      inactiveDays: nextInactiveDays,
      minTotalSpent: nextMinTotalSpent,
      minLastOrderAmount: nextMinLastOrderAmount,
    });
  }

  const applyTelegramTemplate = (templateText) => {
    setTelegramMessage(templateText);
    setTelegramStatus("");
  };

  const handleSendTelegramToOne = async (customer) => {
    try {
      if (!customer?.telegram_user_id) {
        setTelegramStatus("У цього клієнта немає прив'язаного Telegram.");
        return;
      }

      if (!telegramMessage.trim()) {
        setTelegramStatus("Введи текст повідомлення.");
        return;
      }

      setTelegramSending(true);
      setTelegramStatus("");

      const result = await sendTelegramMessageToOne({
        telegramUserId: customer.telegram_user_id,
        text: telegramMessage,
      });

      if (result?.success) {
        setTelegramStatus("Повідомлення клієнту відправлено.");
      } else {
        setTelegramStatus("Не вдалося відправити повідомлення клієнту.");
      }
    } catch (error) {
      setTelegramStatus(error?.message || "Помилка відправки повідомлення.");
    } finally {
      setTelegramSending(false);
    }
  };

  const handleSendTelegramBroadcast = async () => {
    try {
      if (!telegramMessage.trim()) {
        setTelegramStatus("Введи текст розсилки.");
        return;
      }

      setTelegramStatus("");
      setTelegramCounting(true);

      const result = await getTelegramBroadcastCount({
        search,
        orderType,
        inactiveDays,
        minTotalSpent,
        minLastOrderAmount,
      });

      setTelegramRecipientsCount(result?.count || 0);
      setShowTelegramConfirm(true);
    } catch (error) {
      setTelegramStatus(error?.message || "Не вдалося порахувати отримувачів.");
    } finally {
      setTelegramCounting(false);
    }
  };

  const handleConfirmTelegramBroadcast = async () => {
    try {
      setTelegramSending(true);
      setTelegramStatus("");
      await loadTelegramBroadcastHistory();

      const result = await sendTelegramBroadcast({
        text: telegramMessage,
        search,
        orderType,
        inactiveDays,
        minTotalSpent,
        minLastOrderAmount,
      });

      setTelegramStatus(
        `Розсилку завершено. Відправлено: ${result?.sentCount || 0}. Помилок: ${
          result?.failedCount || 0
        }.`
      );
    } catch (error) {
      setTelegramStatus(error?.message || "Помилка під час розсилки.");
    } finally {
      setTelegramSending(false);
      setShowTelegramConfirm(false);
    }
  };

  async function applyMoneyQuickFilter(type) {
    let nextSearch = search;
    let nextOrderType = orderType;
    let nextTelegram = telegram;
    let nextInactiveDays = "";
    let nextMinTotalSpent = "";
    let nextMinLastOrderAmount = "";

    if (type === "total1000") {
      nextMinTotalSpent = "1000";
    }

    if (type === "total2000") {
      nextMinTotalSpent = "2000";
    }

    if (type === "last700") {
      nextMinLastOrderAmount = "700";
    }

    setActiveQuickFilter(type);
    setSearch(nextSearch);
    setOrderType(nextOrderType);
    setTelegram(nextTelegram);
    setInactiveDays(nextInactiveDays);
    setMinTotalSpent(nextMinTotalSpent);
    setMinLastOrderAmount(nextMinLastOrderAmount);

    await loadCustomers({
      search: nextSearch,
      orderType: nextOrderType,
      telegram: nextTelegram,
      inactiveDays: nextInactiveDays,
      minTotalSpent: nextMinTotalSpent,
      minLastOrderAmount: nextMinLastOrderAmount,
    });
  }

  async function handleToggleCustomerOrders(customerId) {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      return;
    }

    setExpandedCustomerId(customerId);

    if (ordersByCustomer[customerId]) {
      return;
    }

    try {
      setLoadingOrdersId(customerId);

      const data = await getCustomerOrders(customerId);

      setOrdersByCustomer((prev) => ({
        ...prev,
        [customerId]: data.orders || [],
      }));
    } catch (err) {
      setError(err.message || "Помилка завантаження замовлень");
    } finally {
      setLoadingOrdersId(null);
    }
  }

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(
      (customer) => Number(customer.orders_count || 0) > 1
    ).length;
    const telegramCustomers = customers.filter(
      (customer) => customer.is_telegram_subscribed
    ).length;

    return {
      totalCustomers,
      repeatCustomers,
      telegramCustomers,
    };
  }, [customers]);

  return (
    <div
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 800,
            color: "#1f2937",
          }}
        >
          Клієнти
        </h1>
        <div
          style={{
            marginTop: "8px",
            color: "#6b7280",
            fontSize: "15px",
          }}
        >
          База клієнтів, повторні замовлення та сегментація для розсилок.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid #ececec",
          }}
        >
          <div style={{ fontSize: "13px", color: "#777" }}>Усього клієнтів</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>
            {stats.totalCustomers}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid #ececec",
          }}
        >
          <div style={{ fontSize: "13px", color: "#777" }}>
            Повторні клієнти
          </div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>
            {stats.repeatCustomers}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid #ececec",
          }}
        >
          <div style={{ fontSize: "13px", color: "#777" }}>Є Telegram</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>
            {stats.telegramCustomers}
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "18px",
          padding: "14px 16px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => applyQuickFilter("all")}
            style={getQuickFilterStyle(
              "all",
              {
                background: "#f3f4f6",
                color: "#111827",
              },
              {
                background: "#e5e7eb",
                color: "#111827",
                boxShadow: "inset 0 0 0 2px #9ca3af",
              }
            )}
          >
            Усі
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("first")}
            style={getQuickFilterStyle(
              "first",
              {
                background: "#eef2ff",
                color: "#3730a3",
              },
              {
                background: "#c7d2fe",
                color: "#312e81",
                boxShadow: "inset 0 0 0 2px #6366f1",
              }
            )}
          >
            Нові
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("repeat")}
            style={getQuickFilterStyle(
              "repeat",
              {
                background: "#ecfdf5",
                color: "#166534",
              },
              {
                background: "#bbf7d0",
                color: "#166534",
                boxShadow: "inset 0 0 0 2px #22c55e",
              }
            )}
          >
            Повторні
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("inactive30")}
            style={getQuickFilterStyle(
              "inactive30",
              {
                background: "#fff7ed",
                color: "#9a3412",
              },
              {
                background: "#fed7aa",
                color: "#7c2d12",
                boxShadow: "inset 0 0 0 2px #ea580c",
              }
            )}
          >
            30+ днів
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("inactive60")}
            style={getQuickFilterStyle(
              "inactive60",
              {
                background: "#fef2f2",
                color: "#991b1b",
              },
              {
                background: "#fecaca",
                color: "#7f1d1d",
                boxShadow: "inset 0 0 0 2px #ef4444",
              }
            )}
          >
            60+ днів
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => applyMoneyQuickFilter("total1000")}
              style={getQuickFilterStyle(
                "total1000",
                {
                  background: "#eef2ff",
                  color: "#3730a3",
                },
                {
                  background: "#c7d2fe",
                  color: "#312e81",
                  boxShadow: "inset 0 0 0 2px #6366f1",
                }
              )}
            >
              1000+ всього
            </button>

            <button
              type="button"
              onClick={() => applyMoneyQuickFilter("total2000")}
              style={getQuickFilterStyle(
                "total2000",
                {
                  background: "#ecfdf5",
                  color: "#166534",
                },
                {
                  background: "#bbf7d0",
                  color: "#166534",
                  boxShadow: "inset 0 0 0 2px #22c55e",
                }
              )}
            >
              2000+ всього
            </button>

            <button
              type="button"
              onClick={() => applyMoneyQuickFilter("last700")}
              style={getQuickFilterStyle(
                "last700",
                {
                  background: "#fff7ed",
                  color: "#9a3412",
                },
                {
                  background: "#fed7aa",
                  color: "#7c2d12",
                  boxShadow: "inset 0 0 0 2px #ea580c",
                }
              )}
            >
              700+ останній чек
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handleCopyCustomerList}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#f3f4f6",
                color: "#111827",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Скопіювати список
            </button>

            <button
              type="button"
              onClick={handleCopyPhones}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "linear-gradient(180deg, #f07a57 0%, #e85d3f 100%)",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Скопіювати телефони
            </button>
          </div>
        </div>

        {copyMessage ? (
          <div
            style={{
              fontSize: "14px",
              color: "#166534",
              fontWeight: 700,
            }}
          >
            {copyMessage}
          </div>
        ) : null}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "18px",
          padding: "16px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1.2fr 1.1fr 1.1fr",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Пошук по імені або телефону"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <select
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">Усі замовлення</option>
            <option value="first">Лише 1 замовлення</option>
            <option value="repeat">Повторні клієнти</option>
          </select>

          <select
            value={telegram}
            onChange={(e) => {
              setTelegram(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">Telegram: усі</option>
            <option value="yes">Є Telegram</option>
            <option value="no">Без Telegram</option>
          </select>

          <input
            type="number"
            min="1"
            placeholder="Не замовляв N днів"
            value={inactiveDays}
            onChange={(e) => {
              setInactiveDays(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.4fr 220px",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <input
            type="number"
            min="0"
            placeholder="Від суми всіх замовлень"
            value={minTotalSpent}
            onChange={(e) => {
              setMinTotalSpent(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <input
            type="number"
            min="0"
            placeholder="Від суми останнього чека"
            value={minLastOrderAmount}
            onChange={(e) => {
              setMinLastOrderAmount(e.target.value);
              setActiveQuickFilter("");
            }}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            type="button"
            onClick={handleApplyFilters}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "12px",
              padding: "13px 18px",
              background: "linear-gradient(180deg, #f07a57 0%, #e85d3f 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Застосувати
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "18px",
          padding: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#222",
            }}
          >
            Telegram-розсилка
          </div>

          <button
            type="button"
            onClick={() => setShowTelegramComposer((prev) => !prev)}
            style={collapseButtonStyle}
          >
            {showTelegramComposer ? "Сховати" : "Розгорнути"}
          </button>
        </div>

        {showTelegramComposer ? (
          <>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {telegramTemplates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => applyTelegramTemplate(template.text)}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "999px",
                    padding: "10px 14px",
                    background: "#fff",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <textarea
              value={telegramMessage}
              onChange={(e) => setTelegramMessage(e.target.value)}
              placeholder="Введи текст повідомлення для Telegram..."
              rows={5}
              style={{
                width: "100%",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "14px 16px",
                fontSize: "15px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleSendTelegramBroadcast}
                disabled={telegramSending || telegramCounting}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  background: "#e57a34",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor:
                    telegramSending || telegramCounting
                      ? "not-allowed"
                      : "pointer",
                  opacity: telegramSending || telegramCounting ? 0.7 : 1,
                }}
              >
                {telegramCounting
                  ? "Підрахунок..."
                  : telegramSending
                  ? "Відправка..."
                  : "Надіслати по фільтру"}
              </button>
            </div>

            {telegramStatus ? (
              <div
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.5,
                }}
              >
                {telegramStatus}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "18px",
          padding: "18px",
          display: "grid",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#222",
            }}
          >
            Список клієнтів
          </div>

          <button
            type="button"
            onClick={() => setShowCustomersList((prev) => !prev)}
            style={collapseButtonStyle}
          >
            {showCustomersList ? "Сховати" : "Розгорнути"}
          </button>
        </div>

        {showCustomersList ? (
          <>
            {customersLoading ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Завантаження клієнтів...
              </div>
            ) : customersError ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {customersError}
              </div>
            ) : customers.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Клієнтів за цим фільтром не знайдено.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {customers.map((customer) => {
                  const isExpanded = expandedCustomerId === customer.id;
                  const hasTelegram = Boolean(customer.telegram_user_id);

                  return (
                    <div
                      key={customer.id}
                      style={{
                        border: "1px solid #eef2f7",
                        borderRadius: "16px",
                        padding: "14px 16px",
                        background: "#fcfcfd",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(180px, 1.2fr) minmax(120px, 0.8fr) minmax(110px, 0.7fr) minmax(160px, 0.9fr) minmax(90px, 0.7fr) minmax(120px, 0.8fr) auto",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#222",
                            }}
                          >
                            {customer.name || "Без імені"}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            {customer.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#222",
                            }}
                          >
                            {customer.orders_count || 0} зам.
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              color: "#777",
                            }}
                          >
                            Середній чек: {customer.avg_check || 0} грн
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#222",
                          }}
                        >
                          {customer.total_spent || 0} грн
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#222",
                            }}
                          >
                            {customer.last_order_at
                              ? new Date(customer.last_order_at).toLocaleString(
                                  "uk-UA"
                                )
                              : "Немає"}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              color: "#777",
                            }}
                          >
                            {customer.last_order_at
                              ? `${Math.max(
                                  0,
                                  Math.floor(
                                    (Date.now() -
                                      new Date(
                                        customer.last_order_at
                                      ).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                )} дн. тому`
                              : ""}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: hasTelegram ? "#166534" : "#777",
                          }}
                        >
                          {hasTelegram ? "Є" : "Немає"}
                        </div>

                        <div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "8px 10px",
                              borderRadius: "999px",
                              background:
                                Number(customer.orders_count || 0) > 1
                                  ? "#ecfdf3"
                                  : "#eff6ff",
                              color:
                                Number(customer.orders_count || 0) > 1
                                  ? "#166534"
                                  : "#1d4ed8",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            {Number(customer.orders_count || 0) > 1
                              ? "Повторний"
                              : "Новий"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCustomerOrders(customer.id)
                            }
                            style={{
                              border: "none",
                              borderRadius: "12px",
                              padding: "10px 14px",
                              background: "#f3f4f6",
                              color: "#222",
                              fontSize: "14px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "Сховати" : "Замовлення"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendTelegramToOne(customer)}
                            disabled={
                              telegramSending || !customer.telegram_user_id
                            }
                            style={{
                              border: "none",
                              borderRadius: "12px",
                              padding: "10px 14px",
                              background: customer.telegram_user_id
                                ? "#eef6ff"
                                : "#f3f4f6",
                              color: customer.telegram_user_id
                                ? "#2563eb"
                                : "#9ca3af",
                              fontSize: "14px",
                              fontWeight: 700,
                              cursor:
                                telegramSending || !customer.telegram_user_id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            Telegram
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div
                          style={{
                            display: "grid",
                            gap: "12px",
                            paddingTop: "6px",
                          }}
                        >
                          {customerOrdersLoading &&
                          expandedCustomerId === customer.id ? (
                            <div
                              style={{
                                padding: "14px",
                                borderRadius: "12px",
                                background: "#f8fafc",
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              Завантаження замовлень...
                            </div>
                          ) : customerOrders.length === 0 ? (
                            <div
                              style={{
                                padding: "14px",
                                borderRadius: "12px",
                                background: "#f8fafc",
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              Замовлень не знайдено.
                            </div>
                          ) : (
                            customerOrders.map((order) => (
                              <div
                                key={order.id}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "14px",
                                  padding: "14px",
                                  background: "#fff",
                                  display: "grid",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      color: "#222",
                                    }}
                                  >
                                    Замовлення #{order.id}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: "15px",
                                      fontWeight: 700,
                                      color: "#222",
                                    }}
                                  >
                                    {order.total_price || 0} грн
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      padding: "6px 9px",
                                      borderRadius: "999px",
                                      background: "#eff6ff",
                                      color: "#1d4ed8",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {order.mode === "pickup"
                                      ? "Самовивіз"
                                      : "Доставка"}
                                  </span>

                                  <span
                                    style={{
                                      padding: "6px 9px",
                                      borderRadius: "999px",
                                      background: "#f3f4f6",
                                      color: "#334155",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {order.payment_method === "cash"
                                      ? "Готівка"
                                      : order.payment_method === "card"
                                      ? "Картка"
                                      : order.payment_method === "bank_transfer"
                                      ? "Переказ"
                                      : order.payment_method || "Оплата"}
                                  </span>

                                  <span
                                    style={{
                                      padding: "6px 9px",
                                      borderRadius: "999px",
                                      background: "#f3f4f6",
                                      color: "#334155",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {order.status || "new"}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#334155",
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  <strong>Склад замовлення:</strong>
                                  <br />
                                  {order.items_summary || "—"}
                                </div>

                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#475569",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  <strong>Адреса:</strong>{" "}
                                  {order.address || "—"}
                                  {"  "}
                                  <strong>Під'їзд:</strong>{" "}
                                  {order.entrance || "—"}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "18px",
          padding: "18px",
          display: "grid",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#222",
            }}
          >
            Історія Telegram-розсилок
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={loadTelegramBroadcastHistory}
              disabled={telegramHistoryLoading}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#fff",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 700,
                cursor: telegramHistoryLoading ? "not-allowed" : "pointer",
              }}
            >
              {telegramHistoryLoading ? "Оновлення..." : "Оновити"}
            </button>

            <button
              type="button"
              onClick={() => setShowTelegramHistory((prev) => !prev)}
              style={collapseButtonStyle}
            >
              {showTelegramHistory ? "Сховати" : "Розгорнути"}
            </button>
          </div>
        </div>

        {showTelegramHistory ? (
          <>
            {telegramHistoryError ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {telegramHistoryError}
              </div>
            ) : null}

            {!telegramHistoryLoading && telegramHistory.length === 0 ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Поки що розсилок не було.
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {telegramHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    background: "#fcfcfd",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#222",
                        fontWeight: 700,
                      }}
                    >
                      Розсилка #{item.id}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#777",
                      }}
                    >
                      {new Date(item.created_at).toLocaleString("uk-UA")}
                    </div>
                  </div>

                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "#334155",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "12px 14px",
                    }}
                  >
                    {item.text}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "8px 10px",
                        borderRadius: "999px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      Отримувачів: {item.recipients_count}
                    </span>

                    <span
                      style={{
                        padding: "8px 10px",
                        borderRadius: "999px",
                        background: "#ecfdf3",
                        color: "#166534",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      Успішно: {item.sent_count}
                    </span>

                    <span
                      style={{
                        padding: "8px 10px",
                        borderRadius: "999px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      Помилки: {item.failed_count}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    Фільтр: {JSON.stringify(item.filters || {}, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {showTelegramConfirm ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
          onClick={() => {
            if (!telegramSending) {
              setShowTelegramConfirm(false);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#fff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
              display: "grid",
              gap: "14px",
            }}
          >
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#222",
              }}
            >
              Підтвердити Telegram-розсилку
            </div>

            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: 1.6,
              }}
            >
              Повідомлення буде відправлене Telegram-клієнтам за поточним
              фільтром.
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "fit-content",
                padding: "10px 14px",
                borderRadius: "999px",
                background: "#fff7ed",
                color: "#c2410c",
                fontSize: "14px",
                fontWeight: 800,
                border: "1px solid #fed7aa",
              }}
            >
              Буде відправлено: {telegramRecipientsCount} клієнт(ам)
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "14px 16px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {telegramMessage}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowTelegramConfirm(false)}
                disabled={telegramSending}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "13px 16px",
                  background: "#fff",
                  color: "#222",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: telegramSending ? "not-allowed" : "pointer",
                }}
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleConfirmTelegramBroadcast}
                disabled={telegramSending || telegramRecipientsCount === 0}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 16px",
                  background: "#e57a34",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor:
                    telegramSending || telegramRecipientsCount === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    telegramSending || telegramRecipientsCount === 0 ? 0.7 : 1,
                }}
              >
                {telegramSending ? "Відправка..." : "Підтвердити відправку"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
