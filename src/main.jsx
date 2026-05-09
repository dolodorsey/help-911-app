import React from "react";
import ReactDOM from "react-dom/client";
import Help911App from "./App.jsx";
import { initNative } from "./native.js";
import { getRouteComponent } from "./routes.jsx";

initNative();

// Path-aware shell. If the URL matches one of the IG-driven landings
// (/now, /treatment, /attorney, /dispatch, /restart, /insurance, /atfault,
//  /family, /partners, /press) — render the focused landing instead of the
// full app. Otherwise fall through to the regular Help 911 SPA.
function Root() {
  const RouteLanding = getRouteComponent(typeof window !== "undefined" ? window.location.pathname : "/");
  if (RouteLanding) return <RouteLanding />;
  return <Help911App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
