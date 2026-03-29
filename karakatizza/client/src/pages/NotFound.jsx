import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <div style={styles.page}>
      <Seo
        title="Доставка та самовивіз — Каракатица Миколаїв"
        description="Умови доставки та самовивозу Каракатица у Миколаєві. Дізнайтесь поріг безкоштовної доставки, графік роботи та зони обслуговування."
        url="https://karakatizza.com/delivery"
      />
      <div style={styles.overlay} />

      <div style={styles.card}>
        <div style={styles.logo}>KARAKATIZZA</div>

        <div style={styles.code}>404</div>

        <h1 style={styles.title}>Сторінку не знайдено</h1>

        <p style={styles.text}>
          Схоже, цей рол поїхав не за тією адресою 🍣  
          Але кухня працює — повертаємо тебе до меню
        </p>

        <div style={styles.buttons}>
          <Link to="/" style={styles.primaryBtn}>
            На головну
          </Link>

          <a href="/#menu" style={styles.secondaryBtn}>
            До меню
          </a>
        </div>

        <div style={styles.footer}>
          📞 096 588 10 10
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at 20% 20%, #1f2937, #111827 60%)",
    padding: "20px",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 80% 80%, rgba(232,109,61,0.2), transparent 40%)",
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "560px",
    padding: "40px 28px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
    textAlign: "center",
  },

  logo: {
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "2px",
    color: "#e86d3d",
    marginBottom: "10px",
  },

  code: {
    fontSize: "80px",
    fontWeight: 900,
    color: "#e86d3d",
    marginBottom: "10px",
    lineHeight: 1,
  },

  title: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#111827",
    marginBottom: "14px",
  },

  text: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "28px",
    lineHeight: 1.5,
  },

  buttons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  primaryBtn: {
    padding: "14px 22px",
    borderRadius: "14px",
    background: "#e86d3d",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    boxShadow: "0 10px 25px rgba(232,109,61,0.4)",
  },

  secondaryBtn: {
    padding: "14px 22px",
    borderRadius: "14px",
    background: "#f3f4f6",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
  },

  footer: {
    fontSize: "14px",
    color: "#9ca3af",
  },
};