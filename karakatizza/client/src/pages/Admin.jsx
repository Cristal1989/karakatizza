import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getImageUrl,
} from "../api/productsApi";

export default function Admin() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

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
      });

      setImage(null);
      setImagePreview("");
      setEditingId(null);

      const fileInput = document.getElementById("image-input");
      if (fileInput) fileInput.value = "";

      await loadProducts();
    } catch (error) {
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
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      description: product.description || "",
    });

    setImage(null);

    const currentImage = getImageUrl(product.image);

    setImagePreview(currentImage);
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
    });

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
        background: "#f7f7f7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
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
          <h1
            style={{ marginBottom: "10px", fontSize: "32px", fontWeight: 800 }}
          >
            Адмінка товарів
          </h1>

          <p style={{ color: "#666", marginBottom: "24px" }}>
            {editingId ? "Редагування товару" : "Додай нову позицію в меню"}
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "16px" }}
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

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Оберіть категорію</option>

              <option value="rolls">Роли</option>
              <option value="baked">Запечені</option>
              <option value="sets">Сети</option>
              <option value="snacks">Закуски</option>
              <option value="drinks">Напої</option>
            </select>

            <textarea
              name="description"
              placeholder="Опис"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={inputStyle}
            />

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
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "14px",
                  background: "#fafafa",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Попередній перегляд"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  }}
                />

                <div>
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                    Фото товару
                  </div>

                  <div style={{ color: "#666", fontSize: "14px" }}>
                    {image
                      ? "Нове фото вибрано, ще не збережено"
                      : "Поточне фото товару"}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#e53935",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
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
                style={{
                  background: "#f3f3f3",
                  color: "#222",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Скасувати редагування
              </button>
            )}
          </form>

          {message && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#f3f3f3",
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{ marginBottom: "18px", fontSize: "26px", fontWeight: 800 }}
          >
            Список товарів
          </h2>

          {productsLoading ? (
            <div style={{ color: "#666", fontWeight: 600 }}>
              Завантаження...
            </div>
          ) : products.length === 0 ? (
            <div style={{ color: "#666", fontWeight: 600 }}>
              Товарів поки немає
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {products.map((product) => {
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
                      borderRadius: "16px",
                      padding: "12px",
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
                            borderRadius: "12px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "12px",
                            background: "#f1f1f1",
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: "18px" }}>
                        {product.name}
                      </div>

                      <div style={{ marginTop: "6px", color: "#666" }}>
                        {product.description || "Без опису"}
                      </div>

                      <div style={{ marginTop: "8px", fontWeight: 700 }}>
                        {product.price} грн
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          color: "#999",
                          fontSize: "14px",
                        }}
                      >
                        Категорія: {product.category}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <button
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
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
};
