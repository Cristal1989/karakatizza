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
      ? "10px"
      : "2px";

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
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flyToCart(imageRef.current);
          });
        });
      }
    }

  return (
    <div
      data-product-id={product.id}
      style={{
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #ececec",
        boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: isMobile ? "150px" : "170px",
          overflow: "hidden",
          background: "#fff",
          borderBottom: "1px solid #f3f3f3",
          flexShrink: 0,
        }}
      >
        {(product.isHit ||
          product.isNew ||
          product.isWeeklyOffer ||
          product.promoType === "2plus1") && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              display: "flex",
              gap: "5px",
              zIndex: 3,
              flexWrap: "wrap",
            }}
          >
            {product.isHit && (
              <span
                style={{
                  background: "#f08a4b",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "4px 7px",
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
                  background: "#1b8904",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "4px 7px",
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
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "4px 7px",
                  borderRadius: "999px",
                  lineHeight: 1,
                }}
              >
                АКЦІЯ
              </span>
            )}

            {product.promoType === "2plus1" && (
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "4px 7px",
                  borderRadius: "999px",
                  lineHeight: 1,
                }}
              >
                2+1
              </span>
            )}
          </div>
        )}

        <img
          ref={imageRef}
          src={imageSrc}
          alt={`${product.name}— доставка суші Каракатица`}
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

      <article
        style={{
          padding: "10px 12px 12px",
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
            marginBottom: "4px",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "18px" : "18px",
              fontWeight: 800,
              color: "#222",
              lineHeight: 1.15,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxHeight: "42px",
            }}
          >
            {product.name}
          </h3>

          <div
            style={{
              fontSize: "12px",
              color: "#9a9a9a",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginTop: "2px",
              marginLeft: "8px",
            }}
          >
            {product.weight || ""}
          </div>
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "#666",
            lineHeight: 1.3,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "38px",
          }}
        >
          {product.description || ""}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            minHeight: "42px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              minHeight: "44px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "18px" : "19px",
                fontWeight: 900,
                color: showOldPrice ? "#d85a43" : "#111",
                lineHeight: 1.05,
                whiteSpace: "nowrap",
              }}
            >
              {product.price} грн
            </div>

            {showOldPrice && (
              <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#000",
                textDecoration: "line-through",
                lineHeight: 1,
                marginTop: "2px",
                opacity: 0.45,
                whiteSpace: "nowrap",
              }}
              >
                {product.oldPrice} грн
              </div>
            )}
          </div>

          <div
            style={{
              width: isMobile ? "106px" : "116px",
              minWidth: isMobile ? "106px" : "116px",
              height: "38px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {quantityInCart > 0 ? (
              <div
                style={{
                  width: "100%",
                  height: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f3f4f6",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => decreaseCartItem(product.id)}
                  style={{
                    width: "38px",
                    height: "38px",
                    border: "none",
                    background: "transparent",
                    fontSize: "20px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  -
                </button>

                <div
                  style={{
                    minWidth: "30px",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "15px",
                  }}
                >
                  {quantityInCart}
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: "38px",
                    height: "38px",
                    border: "none",
                    background: "#e85d3f",
                    color: "#fff",
                    fontSize: "20px",
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
                  width: "100%",
                  height: "38px",
                  border: "none",
                  background: "#e85d3f",
                  color: "#fff",
                  padding: 0,
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
                }}
              >
                В кошик
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default memo(ProductCard);
