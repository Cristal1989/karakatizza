export function flyToCart(imageElement) {
  const targetElement = getCartTarget();

  if (!imageElement || !targetElement) return;

  const imageRect = imageElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const clone = imageElement.cloneNode(true);

  const startSize = Math.min(imageRect.width, imageRect.height, 84);
  const startLeft = imageRect.left + imageRect.width / 2 - startSize / 2;
  const startTop = imageRect.top + imageRect.height / 2 - startSize / 2;

  clone.style.position = "fixed";
  clone.style.left = `${startLeft}px`;
  clone.style.top = `${startTop}px`;
  clone.style.width = `${startSize}px`;
  clone.style.height = `${startSize}px`;
  clone.style.objectFit = "cover";
  clone.style.borderRadius = "18px";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "9999";
  clone.style.opacity = "1";
  clone.style.transform = "translate3d(0,0,0) scale(1)";
  clone.style.transition =
    "transform 0.78s cubic-bezier(0.22, 0.8, 0.2, 1), opacity 0.78s ease, box-shadow 0.78s ease, border-radius 0.78s ease";
  clone.style.boxShadow = "0 14px 30px rgba(0,0,0,0.22)";

  document.body.appendChild(clone);

  const targetX =
    targetRect.left + targetRect.width / 2 - (startLeft + startSize / 2);
  const targetY =
    targetRect.top + targetRect.height / 2 - (startTop + startSize / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(0.18)`;
    clone.style.opacity = "0.18";
    clone.style.borderRadius = "999px";
    clone.style.boxShadow = "0 4px 10px rgba(0,0,0,0.10)";
  });

  setTimeout(() => {
    targetElement.classList.remove("cart-bounce");
    void targetElement.offsetWidth;
    targetElement.classList.add("cart-bounce");
  }, 620);

  setTimeout(() => {
    clone.remove();
  }, 820);
}

function getCartTarget() {
  const mobileCartBar = document.getElementById("mobile-cart-bar");
  const desktopCartBar = document.getElementById("desktop-cart-bar");

  if (isVisible(mobileCartBar)) return mobileCartBar;
  if (isVisible(desktopCartBar)) return desktopCartBar;

  return null;
}

function isVisible(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
