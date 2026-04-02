import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      console.log("LOGIN URL =", `${API_BASE}/admin-auth/login`);
  
      const res = await fetch(`${API_BASE}/admin-auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });
  
      const text = await res.text();
      console.log("LOGIN RAW RESPONSE =", text);
  
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
      }
  
      if (!res.ok) {
        throw new Error(data.message || "Помилка входу");
      }
  
      localStorage.setItem("adminToken", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f7f7",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          display: "grid",
          gap: "14px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>Вхід в адмінку</h1>

        <input
          type="text"
          placeholder="Логін"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          style={{
            height: "46px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            padding: "0 14px",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            height: "46px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            padding: "0 14px",
            fontSize: "16px",
          }}
        />

        {error ? (
          <div style={{ color: "#c0392b", fontSize: "14px" }}>{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: "46px",
            border: "none",
            borderRadius: "10px",
            background: "#d96f3d",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Входимо..." : "Увійти"}
        </button>
      </form>
    </div>
  );
}