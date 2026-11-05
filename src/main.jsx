import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ExperienceProvider } from "./components/Experience.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ExperienceProvider>
      <App />
    </ExperienceProvider>
  </React.StrictMode>,
);
