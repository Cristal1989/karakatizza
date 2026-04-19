import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import Admin from "./pages/Admin";
import AboutPage from "./pages/AboutPage";
import PromotionsPage from "./pages/PromotionsPage";
import DeliveryPage from "./pages/DeliveryPage";
import ContactsPage from "./pages/ContactsPage";
import UserAgreementPage from "./pages/UserAgreementPage";
import ReturnPolicyPage from "./pages/ReturnPolicyPage";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import CustomersPage from "./pages/CustomersPage";
import AdminLogin from "./pages/AdminLogin";
import { trackEvent } from "./utils/analytics";

export default function App() {

  const location = useLocation();

  useEffect(() => {
    const ignoredPrefixes = [
      "/admin",
      "/menu",
      "/reviews",
      "/api",
    ];
  
    const ignoredExactPaths = [
      "/user-agreement",
      "/return-policy",
      "/about",
      "/delivery",
      "/contacts",
      "/promotions",
    ];
  
    const pathname = location.pathname || "";
  
    if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }
  
    if (ignoredExactPaths.includes(pathname)) {
      return;
    }
  
    trackEvent("page_view");
  }, [location.pathname, location.search]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/promotions" element={<PromotionsPage />} />
      <Route path="/delivery" element={<DeliveryPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/user-agreement" element={<UserAgreementPage />} />
      <Route path="/return-policy" element={<ReturnPolicyPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/rolls" element={<CategoryPage />} />
      <Route path="/sets" element={<CategoryPage />} />
      <Route path="/baked-rolls" element={<CategoryPage />} />
      <Route path="/drinks" element={<CategoryPage />} />
      <Route path="/admin/customers" element={<CustomersPage />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
