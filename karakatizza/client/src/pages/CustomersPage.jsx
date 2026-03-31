import { useEffect, useMemo, useState } from "react";
import { getCustomers, getCustomerOrders } from "../api/crmApi";

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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrdersId, setLoadingOrdersId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("all");
  const [telegram, setTelegram] = useState("all");
  const [inactiveDays, setInactiveDays] = useState("");

  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState({});

  const [copyMessage, setCopyMessage] = useState("");

  const [minTotalSpent, setMinTotalSpent] = useState("");
  const [minLastOrderAmount, setMinLastOrderAmount] = useState("");

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
  }, []);

  async function handleApplyFilters() {
    await loadCustomers();
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

  async function applyMoneyQuickFilter(type) {
    let nextSearch = search;
    let nextOrderType = orderType;
    let nextTelegram = telegram;
    let nextInactiveDays = inactiveDays;
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

  async function handleToggleOrders(customerId) {
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
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "#f3f4f6",
              color: "#111827",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Усі
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("first")}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "#eef2ff",
              color: "#3730a3",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Нові
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("repeat")}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "#ecfdf5",
              color: "#166534",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Повторні
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("inactive30")}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "#fff7ed",
              color: "#9a3412",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            30+ днів
          </button>

          <button
            type="button"
            onClick={() => applyQuickFilter("inactive60")}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "#fef2f2",
              color: "#991b1b",
              fontWeight: 700,
              cursor: "pointer",
            }}
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
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#eef2ff",
                color: "#3730a3",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              1000+ всього
            </button>

            <button
              type="button"
              onClick={() => applyMoneyQuickFilter("total2000")}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#ecfdf5",
                color: "#166534",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              2000+ всього
            </button>

            <button
              type="button"
              onClick={() => applyMoneyQuickFilter("last700")}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#fff7ed",
                color: "#9a3412",
                fontWeight: 700,
                cursor: "pointer",
              }}
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
            onChange={(e) => setSearch(e.target.value)}
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
            onChange={(e) => setOrderType(e.target.value)}
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
            onChange={(e) => setTelegram(e.target.value)}
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
            onChange={(e) => setInactiveDays(e.target.value)}
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
            onChange={(e) => setMinTotalSpent(e.target.value)}
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
            onChange={(e) => setMinLastOrderAmount(e.target.value)}
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
          background: "#fff",
          borderRadius: "22px",
          border: "1px solid #ececec",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "28px", fontSize: "15px", color: "#666" }}>
            Завантаження клієнтів...
          </div>
        ) : error ? (
          <div style={{ padding: "28px", fontSize: "15px", color: "#c0392b" }}>
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: "28px", fontSize: "15px", color: "#666" }}>
            Клієнтів не знайдено
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {customers.map((customer) => {
              const isExpanded = expandedCustomerId === customer.id;
              const orders = ordersByCustomer[customer.id] || [];

              return (
                <div
                  key={customer.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr 1fr 1fr auto",
                      gap: "12px",
                      padding: "18px 20px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#1f2937",
                        }}
                      >
                        {customer.name || "Без імені"}
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          {customer.phone}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopySinglePhone(customer.phone)}
                          style={{
                            border: "none",
                            borderRadius: "10px",
                            padding: "5px 9px",
                            background: "#f3f4f6",
                            color: "#111827",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Копія
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      <div style={{ fontWeight: 700 }}>
                        {customer.orders_count} зам.
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        Середній чек: {formatMoney(customer.avg_check)}
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      {formatMoney(customer.total_spent)}
                    </div>

                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <div>{formatDate(customer.last_order_at)}</div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#888",
                            marginTop: "3px",
                          }}
                        >
                          {getDaysSince(customer.last_order_at) ?? "—"} дн. тому
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      {customer.is_telegram_subscribed ? "Є" : "Немає"}
                    </div>

                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      {(() => {
                        const segment = getCustomerSegment(customer);

                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "7px 10px",
                              borderRadius: "999px",
                              background: segment.background,
                              color: segment.color,
                              fontSize: "13px",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {segment.label}
                          </span>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleOrders(customer.id)}
                      style={{
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        background: "#f3f4f6",
                        color: "#111827",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "Сховати" : "Замовлення"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        background: "#fafafa",
                        padding: "0 20px 20px",
                      }}
                    >
                      {loadingOrdersId === customer.id ? (
                        <div
                          style={{
                            padding: "14px 0",
                            fontSize: "14px",
                            color: "#666",
                          }}
                        >
                          Завантаження замовлень...
                        </div>
                      ) : orders.length === 0 ? (
                        <div
                          style={{
                            padding: "14px 0",
                            fontSize: "14px",
                            color: "#666",
                          }}
                        >
                          Замовлень немає
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            paddingTop: "10px",
                          }}
                        >
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              style={{
                                background: "#fff",
                                border: "1px solid #ececec",
                                borderRadius: "16px",
                                padding: "16px",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "16px",
                                  flexWrap: "wrap",
                                  alignItems: "flex-start",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: "#1f2937",
                                      fontSize: "16px",
                                    }}
                                  >
                                    Замовлення #{order.id}
                                  </div>

                                  <div
                                    style={{
                                      marginTop: "4px",
                                      color: "#6b7280",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {formatDate(order.created_at)}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    fontWeight: 800,
                                    color: "#111827",
                                    fontSize: "16px",
                                  }}
                                >
                                  {formatMoney(order.total_amount)}
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: "12px",
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "7px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    ...getModeBadgeStyle(order.mode),
                                  }}
                                >
                                  {getModeLabel(order.mode)}
                                </span>

                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "7px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    ...getPaymentBadgeStyle(
                                      order.payment_method
                                    ),
                                  }}
                                >
                                  {getPaymentLabel(order.payment_method)}
                                </span>

                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "7px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    background: "#f3f4f6",
                                    color: "#374151",
                                  }}
                                >
                                  {order.status || "new"}
                                </span>
                              </div>

                              <div
                                style={{
                                  marginTop: "14px",
                                  background: "#fafafa",
                                  border: "1px solid #f0f0f0",
                                  borderRadius: "14px",
                                  padding: "12px 14px",
                                  fontSize: "14px",
                                  color: "#374151",
                                  lineHeight: 1.5,
                                }}
                              >
                                <strong style={{ color: "#111827" }}>
                                  Склад замовлення:
                                </strong>
                                <div style={{ marginTop: "6px" }}>
                                  {order.items_summary || "—"}
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: "12px",
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                  gap: "10px",
                                  fontSize: "14px",
                                  color: "#374151",
                                }}
                              >
                                <div>
                                  <strong>Адреса:</strong>{" "}
                                  {order.address || "—"}
                                </div>

                                <div>
                                  <strong>Підʼїзд:</strong>{" "}
                                  {order.entrance || "—"}
                                </div>
                              </div>

                              {order.comment ? (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    fontSize: "14px",
                                    color: "#374151",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  <strong>Коментар:</strong> {order.comment}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
