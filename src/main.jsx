import React from "react";
import ReactDOM from "react-dom/client";
import Help911App from "./App.jsx";
import RequestHelp from "./RequestHelp.jsx";
import { initNative } from "./native.js";
import { initProviderPrivacy } from "./providerPrivacy.js";
import { getRouteComponent } from "./routes.jsx";

initNative();
initProviderPrivacy();

// Path-aware shell. Focused public routes render their own landing/intake while
// the main HELP 911 application remains the default experience.
function Root() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  if (pathname.replace(/\/$/, "") === "/request-help") return <RequestHelp />;

  const RouteLanding = getRouteComponent(pathname);
  if (RouteLanding) return <RouteLanding />;
  return <Help911App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
