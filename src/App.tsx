import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster, type ToasterProps } from "react-hot-toast";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Overlay from "./pages/Overlay";
import Onboarding from "./components/Onboarding";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { useSettingsStore } from "./stores/settingsStore";
import { useTranslation } from "./i18n";

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

const TOAST_OPTIONS: ToasterProps["toastOptions"] = {
  style: {
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
  },
};

function AppContent() {
  useTauriEvents();
  const { loadSettings, loading, darkMode } = useSettingsStore();
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.body.classList.add("main-window");
  }, []);

  useEffect(() => {
    loadSettings().then(() => {
      const state = useSettingsStore.getState();
      if (!state.apiKey) {
        setShowOnboarding(true);
      }
      applyTheme(state.darkMode);
    });
  }, [loadSettings]);

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--color-brand)" }} />
      </div>
    );
  }

  return (
    <>
      {showOnboarding ? (
        <div className="min-h-screen" style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}>
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </div>
      ) : (
        <HashRouter>
          <div className="min-h-screen flex" style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}>
            {/* Sidebar */}
            <nav
              className="w-14 flex flex-col items-center py-4 gap-2"
              style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
            >
              <NavLink
                to="/"
                className="p-2.5 rounded-lg transition-all duration-150"
                style={({ isActive }) => ({
                  color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                  background: isActive ? "rgba(30, 111, 255, 0.12)" : "transparent",
                })}
                title={t("nav.dashboard")}
              >
                <LayoutDashboard className="w-5 h-5" />
              </NavLink>
              <NavLink
                to="/settings"
                className="p-2.5 rounded-lg transition-all duration-150"
                style={({ isActive }) => ({
                  color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                  background: isActive ? "rgba(30, 111, 255, 0.12)" : "transparent",
                })}
                title={t("nav.settings")}
              >
                <SettingsIcon className="w-5 h-5" />
              </NavLink>
            </nav>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      )}
      <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
    </>
  );
}

export default function App() {
  const windowLabel = getCurrentWindow().label;
  if (windowLabel === "overlay") {
    return <Overlay />;
  }

  return <AppContent />;
}
