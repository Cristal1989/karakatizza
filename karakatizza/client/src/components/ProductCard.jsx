import { memo, useRef } from "react";
import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";
import { flyToCart } from "../utils/flyToCart";

function ProductCard({ product }) {
  const { addToCart, decreaseCartItem, getItemQuantity } = useCart();
  const imageRef = useRef(null);

  const quantityInCart = getItemQuantity(product.id);
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const category = (product.category || "").toLowerCase();

  const imagePadding =
    category === "drinks" ||
    category === "snacks" ||
    category === "extras" ||
    category === "sauces"
      ? "16px"
      : "8px";

  const imageSrc = getImageUrl(product.image, {
    width: 900,
    height: 900,
    crop: "fit",
  });

  const showOldPrice =
    Number(product.oldPrice) > 0 &&
    Number(product.oldPrice) > Number(product.price);

  function handleAddToCart() {
    addToCart(product);
    if (imageRef.current) {
      flyToCart(imageRef.current);
    }
  }

  return (
    <div
      data-product-id={product.id}
      style={{
        background: "#fff",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #eee",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: isMobile ? "180px" : "210px",
          overflow: "hidden",
          background: "#fff",
          borderBottom: "1px solid #f3f3f3",
          flexShrink: 0,
        }}
      >
        {(product.isHit || product.isNew || product.isWeeklyOffer) && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              gap: "6px",
              zIndex: 3,
              flexWrap: "wrap",
            }}
          >
            {product.isHit && (
              <span
                style={{
                  background: "#f08a4b",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  lineHeight: 1,
                }}
              >
                HIT
              </span>
            )}

            {product.isNew && (
              <span
                style={{
                  background: "#1B8904",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  lineHeight: 1,
                }}
              >
                NEW
              </span>
            )}

            {product.isWeeklyOffer && (
              <span
                style={{
                  background: "#e85d3f",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  lineHeight: 1,
                }}
              >
                АКЦІЯ
              </span>
            )}
          </div>
        )}

        <img
          ref={imageRef}
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            padding: imagePadding,
            boxSizing: "border-box",
            background: "#fff",
          }}
        />
      </div>

      <div
        style={{
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "6px",
            minHeight: "44px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "17px" : "18px",
              fontWeight: 800,
              color: "#222",
              lineHeight: 1.2,
              flex: 1,
            }}
          >
            {product.name}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#8c8c8c",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            {product.weight || ""}
          </div>
        </div>

        <div
          style={{
            fontSize: "15px",
            color: "#666",
            lineHeight: 1.35,
            height: "42px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          {product.description || ""}
        </div>

        <div
          style={{
            marginTop: "auto",
            minHeight: "72px", // 👈 ключ
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {showOldPrice && (
            <div
              style={{
                fontSize: "14px",
                color: "#999",
                textDecoration: "line-through",
                marginBottom: "4px",
                minHeight: "18px",
              }}
            >
              {product.oldPrice} грн
            </div>
          )}

          {!showOldPrice && (
            <div
              style={{
                minHeight: "18px",
                marginBottom: "4px",
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "18px" : "20px",
                fontWeight: 800,
                color: "#111",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {product.price} грн
            </div>

            {quantityInCart > 0 ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f3f4f6",
                  borderRadius: "14px",
                  overflow: "hidden",
                  flexShrink: 0,
                  minHeight: "40px",
                }}
              >
                <button
                  onClick={() => decreaseCartItem(product.id)}
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "none",
                    background: "transparent",
                    fontSize: "22px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  -
                </button>

                <div
                  style={{
                    minWidth: "34px",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "16px",
                  }}
                >
                  {quantityInCart}
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "none",
                    background: "#e85d3f",
                    color: "#fff",
                    fontSize: "22px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                style={{
                  border: "none",
                  background: "#e85d3f",
                  color: "#fff",
                  padding: "12px 26px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  height: "40px",
                }}
              >
                В кошик
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
