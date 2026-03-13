import { useEffect, useMemo, useState } from "react";
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

  const [bannerForm, setBannerForm] = useState({
    title: "",
    link: "#menu",
    priority: 10,
    isActive: true,
    endAt: "",
  });

  useEffect(() => {
    loadProducts();
    loadBanners();
  }, []);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await getProducts();
      console.log("LOADED PRODUCTS:", data);
      setProducts(data);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError(err.message || "Не вдалося завантажити товари");
    } finally {
      setProductsLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("name", form.name?.trim() || "");
      formData.append("price", String(form.price || ""));
      formData.append("category", form.category || "");
      formData.append("description", form.description || "");
      formData.append("popular", String(!!popular));
      formData.append("promoType", form.promoType || "none");
      formData.append("priority", String(form.priority || 10));

      if (image) {
        formData.append("image", image);
      }

      for (const pair of formData.entries()) {
        console.log("FORMDATA:", pair[0], pair[1]);
      }

      if (editingId) {
        const result = await updateProduct(editingId, formData);
        console.log("UPDATE RESULT:", result);

        if (result?.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingId ? result.product : p))
          );
        }

        setMessage("✅ Товар оновлено");
      } else {
        const result = await createProduct(formData);
        console.log("CREATE RESULT:", result);

        if (result?.product) {
          setProducts((prev) => [result.product, ...prev]);
        }

        setMessage("✅ Товар додано");
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

                  <div style={{ marginBottom: "16px" }}>
                    <input
                      id="product-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>

                  {imagePreview ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginTop: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Фото товару"
                        style={{
                          width: "96px",
                          height: "96px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          border: "1px solid #eee",
                        }}
                      />

                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          Фото товару
                        </div>
                        <div style={{ color: "#666", fontSize: "14px" }}>
                          Нове фото вибрано, ще не збережено
                        </div>
                      </div>
                    </div>
                  ) : null}

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
                            alt="desktop preview"
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
                            alt="mobile preview"
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
                            alt={banner.title || "banner"}
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
                              alt="mobile banner"
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
