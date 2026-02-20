import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Overlay from "./pages/Overlay";
import Onboarding from "./components/Onboarding";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { useSettingsStore } from "./stores/settingsStore";

function AppContent() {
  useTauriEvents();
  const { loadSettings, loading } = useSettingsStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadSettings().then(() => {
      const state = useSettingsStore.getState();
      if (!state.apiKey) {
        setShowOnboarding(true);
      }
      document.documentElement.classList.toggle("dark", state.darkMode);
    });
  }, [loadSettings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Onboarding onComplete={() => setShowOnboarding(false)} />
        <Toaster position="bottom-right" />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex">
        {/* Sidebar */}
        <nav className="w-14 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `p-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
            title="Settings"
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
      <Toaster position="bottom-right" />
    </HashRouter>
  );
}

export default function App() {
  // If this is the overlay window, render only the overlay component
  const windowLabel = getCurrentWindow().label;
  if (windowLabel === "overlay") {
    // Make html/body fully transparent for the overlay window
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return <Overlay />;
  }

  return <AppContent />;
}
