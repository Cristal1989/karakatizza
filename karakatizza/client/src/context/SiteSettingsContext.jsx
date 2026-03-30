import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../api/siteSettingsApi";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [siteSettings, setSiteSettings] = useState(null);
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("LOAD SITE SETTINGS ERROR:", error);
      } finally {
        setSiteSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider
      value={{
        siteSettings,
        setSiteSettings,
        siteSettingsLoading,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}