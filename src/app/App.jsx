import { useRoutes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
// ROOT THEME PROVIDER
import { MatxTheme } from "./components";
// ALL CONTEXTS
import SettingsProvider from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/FirebaseAuthContext";
// ROUTES
import routes from "./routes";
// FAKE SERVER
import "../__api__";

export default function App() {
  const content = useRoutes(routes);

  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || "/";

    // simple mapping from path prefix to human friendly title
    const titleMap = [
      ["/dashboard", "Dashboard"],
      ["/charts", "Charts"],
      ["/material", "Material UI"],
      ["/sessions", "Session"],
      ["/apps", "Apps"],
      ["/pages", "Pages"]
    ];

    let pageTitle = "Astadata Dashboard";

    for (const [prefix, name] of titleMap) {
      if (pathname.startsWith(prefix)) {
        pageTitle = `${name} - Astadata Dashboard`;
        break;
      }
    }

    document.title = pageTitle;
  }, [location.pathname]);

  return (
    <SettingsProvider>
      <AuthProvider>
        <MatxTheme>
          <CssBaseline />
          {content}
        </MatxTheme>
      </AuthProvider>
    </SettingsProvider>
  );
}
