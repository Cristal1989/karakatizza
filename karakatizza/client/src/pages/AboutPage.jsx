import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo";

export default function AboutPage() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        padding: isMobile ? "20px 16px 110px" : "32px 24px 120px",
        boxSizing: "border-box",
      }}
    >
      <Seo
        title="Доставка та самовивіз — Каракатица Миколаїв"
        description="Умови доставки та самовивозу Каракатица у Миколаєві. Дізнайтесь поріг безкоштовної доставки, графік роботи та зони обслуговування."
        url="https://karakatizza.com/delivery"
      />
      <h1 style={{ display: "none" }}>
  Доставка суші та ролів у Миколаєві
</h1>
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            background: "rgb(47, 49, 54)",
            borderRadius: isMobile ? "22px" : "28px",
            padding: isMobile ? "28px 20px" : "42px 36px",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            marginBottom: isMobile ? "18px" : "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: 700,
              color: "#ffd54a",
              marginBottom: "16px",
            }}
          >
            Karakatizza • Миколаїв
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "32px" : "46px",
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Про нас
          </h2>

          <p
            style={{
              margin: "16px 0 0",
              maxWidth: "760px",
              fontSize: isMobile ? "16px" : "19px",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Karakatizza — це доставка ролів, сетів, закусок і напоїв у
            Миколаєві, де головне не просто швидко привезти замовлення, а
            зробити так, щоб було дійсно смачно, свіжо і хотілося замовити ще
            раз.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: isMobile ? "14px" : "18px",
            marginBottom: isMobile ? "18px" : "24px",
          }}
        >
          {[
            {
              title: "Свіжі інгредієнти",
              text: "Ми робимо ставку на якісні продукти, тому смак починається не з соусу, а з хороших інгредієнтів.",
            },
            {
              title: "Акуратна кухня",
              text: "Для нас важливо, щоб роли були не тільки смачні, а й красиві, щільні, свіжі та зроблені уважно до деталей.",
            },
            {
              title: "Чесний підхід",
              text: "Ми готуємо так, як хотіли б отримувати самі: щедро, охайно і без компромісів у якості.",
            },
            {
              title: "Сервіс, до якого повертаються",
              text: "Найкращий результат для нас — коли клієнт замовляє знову, бо йому реально сподобалося.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                borderRadius: isMobile ? "18px" : "22px",
                padding: isMobile ? "18px 16px" : "22px 20px",
                border: "1px solid #f0f0f0",
                boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? "20px" : "22px",
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: "#1f1f1f",
                }}
              >
                {item.title}
              </h2>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: isMobile ? "15px" : "16px",
                  lineHeight: 1.6,
                  color: "#666",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: isMobile ? "20px" : "24px",
            padding: isMobile ? "22px 18px" : "28px 24px",
            border: "1px solid #f1f1f1",
            boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
            marginBottom: isMobile ? "18px" : "24px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "24px" : "30px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#222",
              marginBottom: "14px",
            }}
          >
            Наша філософія
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.75,
              color: "#5f5f5f",
            }}
          >
            Ми не хочемо бути просто ще однією доставкою. Нам важливо, щоб кожне
            замовлення залишало правильне враження: свіжі роли, хороший баланс
            смаку, нормальна порція, акуратна подача і відчуття, що для тебе
            дійсно постаралися. Саме з таких дрібниць і складається сервіс,
            якому довіряють.
          </p>
        </section>

        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(232,93,63,0.08) 0%, rgba(255,213,74,0.12) 100%)",
            border: "1px solid rgba(232,93,63,0.10)",
            borderRadius: isMobile ? "20px" : "24px",
            padding: isMobile ? "22px 18px" : "30px 26px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#1f1f1f",
              marginBottom: "10px",
            }}
          >
            Karakatizza — коли хочеться дійсно смачні суші та роли в Миколаєві.
          </div>

          <div
            style={{
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.7,
              color: "#5f5f5f",
            }}
          >
            Ми готуємо для сімейних вечорів, спонтанних зустрічей, затишних
            домашніх вечерь і моментів, коли просто хочеться порадувати себе
            чимось смачним. І хочемо, щоб у такі моменти ти згадував саме нас.
          </div>
        </section>
        <section
          style={{
            background: "#fff",
            borderRadius: isMobile ? "20px" : "24px",
            padding: isMobile ? "22px 18px" : "28px 24px",
            border: "1px solid #f1f1f1",
            boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
            marginBottom: isMobile ? "18px" : "24px",
            marginTop: isMobile ? "18px" : "24px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "24px" : "30px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#222",
              marginBottom: "14px",
            }}
          >
            Доставка суші та ролів у Миколаєві
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.75,
              color: "#5f5f5f",
            }}
          >
            Якщо шукаєш доставку суші у Миколаєві, де важливий не тільки час, 
    а й смак — ти за адресою. У Karakatizza ми готуємо роли та сети 
    зі свіжих інгредієнтів і уважно ставимося до кожного замовлення.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.75,
              color: "#5f5f5f",
            }}
          >
             У меню є класичні роли, Філадельфія, запечені роли та сети для компанії. 
    Ми працюємо по всьому місту, включаючи район Намив, і пропонуємо 
    як доставку, так і самовивіз.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.75,
              color: "#5f5f5f",
            }}
          >
             Замовити суші в Миколаєві можна онлайн за кілька хвилин. 
    Ми зробили сайт максимально простим, щоб ти витрачав час 
    не на оформлення, а на очікування смачної їжі. Karakatizza — це зручна доставка суші у Миколаєві, які хочеться замовляти знову.
          </p>
        </section>
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #ff7a3d, #e85d3f)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(232,93,63,0.25)",
            transition: "all 0.2s ease",
          }}
        >
          ← На головну
        </button>
      </div>
    </main>
  );
}
