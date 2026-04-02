import React from "react";
import ReactDOM from "react-dom/client";
import Help911App from "./App.jsx";
import { initNative } from "./native.js";

initNative();

ReactDOM.createRoot(document.getElementById("root")).render(<Help911App />);
