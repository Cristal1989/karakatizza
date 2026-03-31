import { Routes, Route } from "react-router-dom";
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

export default function App() {
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
