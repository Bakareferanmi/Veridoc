"use client";
import { useEffect, useState } from "react";
import App from "../src/App.jsx";
import { ExperienceProvider } from "../src/components/Experience.jsx";
import { AccountProvider } from "../src/components/Account.jsx";
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <div className="boot-screen" role="status">
        VeriDoc
      </div>
    );
  return (
    <ExperienceProvider>
      <AccountProvider>
        <App />
      </AccountProvider>
    </ExperienceProvider>
  );
}
