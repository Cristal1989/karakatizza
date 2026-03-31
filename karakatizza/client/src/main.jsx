import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SiteSettingsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SiteSettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
