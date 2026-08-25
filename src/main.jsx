import React from "react";
import ReactDOM from "react-dom/client";
import Help911App from "./App.jsx";
import RequestHelp from "./RequestHelp.jsx";
import VictimCaseIntake from "./VictimCaseIntake.jsx";
import AccidentSupportNudge from "./AccidentSupportNudge.jsx";
import { initNative } from "./native.js";
import { initProviderPrivacy } from "./providerPrivacy.js";
import { getRouteComponent } from "./routes.jsx";

initNative();
initProviderPrivacy();

function Root() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const normalized=pathname.replace(/\/$/, "")||"/";
  if (normalized === "/request-help") return <RequestHelp />;
  if (normalized === "/case") return <VictimCaseIntake />;

  const RouteLanding = getRouteComponent(pathname);
  if (RouteLanding) return <RouteLanding />;
  return <><Help911App/><AccidentSupportNudge/></>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
