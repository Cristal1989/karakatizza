import { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getImageUrl,
} from "../api/productsApi";

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
  { value: "baked", label: "Запечені" },
  { value: "snacks", label: "Салати і закуски" },
  { value: "bowls", label: "Суші боули" },
  { value: "drinks", label: "Напої" },
  { value: "extras", label: "Додатково" },
];

export default function Admin() {
  const [activeSection, setActiveSection] = useState("products");

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    promoType: "none",
    priority: 10,
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [popular, setPopular] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setProductsLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setProductsLoading(false);
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

        return (
          (product.name || "").toLowerCase().includes(q) ||
          (product.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const pa = Number(a.priority ?? 10);
        const pb = Number(b.priority ?? 10);
        if (pa !== pb) return pa - pb;
        return (a.name || "").localeCompare(b.name || "", "uk");
      });
  }, [products, categoryFilter, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setImage(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("popular", popular);
      formData.append("promoType", form.promoType);
      formData.append("priority", form.priority);

      if (image) {
        formData.append("image", image);
      }

      if (editingId) {
        await updateProduct(editingId, formData);
        setMessage("✅ Товар успішно оновлено");
      } else {
        await createProduct(formData);
        setMessage("✅ Товар успішно додано");
      }

      setForm({
        name: "",
        price: "",
        category: "",
        description: "",
        promoType: "none",
        priority: 10,
      });

      setPopular(false);
      setImage(null);
      setImagePreview("");
      setEditingId(null);

      const fileInput = document.getElementById("image-input");
      if (fileInput) fileInput.value = "";

      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
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
        nextPriority = Math.min(10, currentPriority + 1);
      }

      if (nextPriority === currentPriority) {
        return;
      }

      const formData = new FormData();
      formData.append("name", product.name || "");
      formData.append("price", product.price || "");
      formData.append("category", product.category || "");
      formData.append("description", product.description || "");
      formData.append("popular", !!product.popular);
      formData.append("promoType", product.promoType || "none");
      formData.append("priority", nextPriority);

      await updateProduct(product.id, formData);

      setMessage(`✅ Пріоритет "${product.name}" змінено на ${nextPriority}`);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setActiveSection("products");
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      description: product.description || "",
      promoType: product.promoType || "none",
      priority: Number(product.priority ?? 10),
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
      category: "",
      description: "",
      promoType: "none",
      priority: 10,
    });

    setPopular(false);
    setImage(null);
    setImagePreview("");
    setMessage("");

    const fileInput = document.getElementById("image-input");
    if (fileInput) fileInput.value = "";
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
                  style={{ display: "grid", gap: "16px" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 220px 180px",
                      gap: "16px",
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

                    <input
                      type="number"
                      name="price"
                      placeholder="Ціна"
                      value={form.price}
                      onChange={handleChange}
                      style={inputStyle}
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
                      <option value="baked">Запечені</option>
                      <option value="snacks">Салати і закуски</option>
                      <option value="bowls">Суші боули</option>
                      <option value="drinks">Напої</option>
                      <option value="extras">Додатково</option>
                    </select>

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
                    style={inputStyle}
                  />

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
                      checked={popular}
                      onChange={(e) => setPopular(e.target.checked)}
                    />
                    <span style={{ fontWeight: 700 }}>Хіт продажу</span>
                  </label>

                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={inputStyle}
                  />

                  {imagePreview && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px",
                        borderRadius: "18px",
                        border: "1px solid #eee",
                        background: "#fafafa",
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "16px",
                        }}
                      />

                      <div>
                        <div style={{ fontWeight: 800, marginBottom: "6px" }}>
                          Фото товару
                        </div>
                        <div style={{ color: "#667085", fontSize: "14px" }}>
                          {image
                            ? "Нове фото вибрано, ще не збережено"
                            : "Поточне фото товару"}
                        </div>
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
                        : editingId
                        ? "Зберегти зміни"
                        : "Додати товар"}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={secondaryButtonStyle}
                      >
                        Скасувати редагування
                      </button>
                    )}
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
                                alt={product.name}
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
            <PlaceholderCard
              title="Банер на головній"
              text="Тут пізніше зробимо керування головним банером, заголовком, кнопками та фото."
            />
          )}

          {activeSection === "promos" && (
            <PlaceholderCard
              title="Акції"
              text="Тут можна буде керувати акціями, подарунками та маркетинговими блоками на головній."
            />
          )}

          {activeSection === "settings" && (
            <PlaceholderCard
              title="Налаштування"
              text="Тут додамо базові налаштування сайту, контакти, години роботи та службову інформацію."
            />
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
