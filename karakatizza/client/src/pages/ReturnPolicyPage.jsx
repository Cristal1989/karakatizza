import React from "react";
import { Link } from "react-router-dom";

export default function ReturnPolicyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <h1 style={{ display: "none" }}>
  Доставка суші та ролів у Миколаєві
</h1>
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "20px 16px 32px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #20263a 0%, #2b324a 100%)",
            color: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              color: "#ffd54a",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Karakatizza • Миколаїв
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "34px",
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            Умови повернення
          </h2>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: "18px",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.88)",
              maxWidth: "760px",
            }}
          >
            Інформація про причини повернення товару, порядок дій та процедуру
            повернення коштів.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <Link to="/" style={buttonPrimary}>
              На головну
            </Link>

            <Link to="/user-agreement" style={buttonSecondary}>
              Користувацька угода
            </Link>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            border: "1px solid #ececec",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            color: "#333",
          }}
        >
          <SectionTitle>Для повернення товару необхідно:</SectionTitle>

          <Paragraph strong>
            Зателефонувати нам, повідомити свої дані про замовлення — фотографії
            накладної або інші дані, що підтверджують замовлення в нашому
            магазині, вказати причину повернення продукції, вислухати інструкції
            та правила повернення.
          </Paragraph>

          <SubTitle>Причини повернення товару:</SubTitle>

          <NumberItem>1. Отриманий товар не свіжий.</NumberItem>

          <NumberItem>
            2. Отриманий товар відповідає не зазначеному у замовленні (замовляли
            один товар, привезли інший).
          </NumberItem>

          <NumberItem>3. Отриманий товар не вказано у накладній.</NumberItem>

          <SubTitle>Процедура повернення товару:</SubTitle>

          <NumberItem>
            1. Якщо замовник відразу після отримання відмовився від продукції,
            товар забирає кур&apos;єр.
          </NumberItem>

          <NumberItem>
            2. Якщо замовник виявив невідповідність після відходу кур&apos;єра,
            товар повертає замовник самостійно або викликає кур&apos;єра нашої
            компанії (платна послуга) для забору товару.
          </NumberItem>

          <SubTitle>Процедура повернення грошей:</SubTitle>

          <NumberItem>
            1. У разі повернення продукції при оплаті товару готівкою, вартість
            товару, що повертається, віднімається із суми, що передається
            кур&apos;єру.
          </NumberItem>

          <NumberItem>
            2. У разі оплати карткою, повернення коштів замовнику проводиться
            протягом 14 робочих днів з моменту розгляду рекламації, у разі, якщо
            прийнято позитивне рішення.
          </NumberItem>

          <NumberItem>
            3. При оплаті товару за виставленим рахунком, від замовника
            необхідний лист, у якому вказується сума, яку необхідно повернути,
            та причина повернення товару.
          </NumberItem>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "18px",
              borderTop: "1px solid #ececec",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link to="/" style={buttonPrimary}>
              На головну
            </Link>

            <Link to="/delivery" style={buttonSecondary}>
              Оплата і доставка
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        margin: "0 0 14px",
        fontSize: "28px",
        fontWeight: 800,
        color: "#222",
        lineHeight: 1.15,
      }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }) {
  return (
    <h3
      style={{
        margin: "24px 0 12px",
        fontSize: "22px",
        fontWeight: 800,
        color: "#222",
        lineHeight: 1.2,
      }}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children, strong = false }) {
  return (
    <p
      style={{
        margin: "0 0 14px",
        fontSize: "16px",
        lineHeight: 1.7,
        color: strong ? "#333" : "#555",
        fontWeight: strong ? 700 : 400,
      }}
    >
      {children}
    </p>
  );
}

function NumberItem({ children }) {
  return (
    <p
      style={{
        margin: "0 0 14px",
        fontSize: "16px",
        lineHeight: 1.7,
        color: "#555",
      }}
    >
      {children}
    </p>
  );
}

const buttonPrimary = {
  textDecoration: "none",
  background: "#e85d3f",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "14px",
  fontWeight: 700,
  fontSize: "15px",
};

const buttonSecondary = {
  textDecoration: "none",
  background: "#fff3dc",
  color: "#c98716",
  padding: "12px 18px",
  borderRadius: "14px",
  fontWeight: 700,
  fontSize: "15px",
};
