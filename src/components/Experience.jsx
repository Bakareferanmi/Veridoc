import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ExperienceContext = createContext(null);

export function Icon({ name, size = 20, ...props }) {
  const paths = {
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="15" width="6" height="6" rx="1" />
        <path d="M15 15h3v3h3m-6 3h3m3-9v3M12 3v3M3 12h3m6 0v6" />
      </>
    ),
    document: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8m-8 4h5" />
      </>
    ),
    institution: (
      <>
        <path d="m3 8 9-5 9 5v2H3zM5 10v9m7-9v9m7-9v9M3 21h18" />
      </>
    ),
    review: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V2h6v2M8 11l2 2 5-5m-7 9h8" />
      </>
    ),
    seal: (
      <>
        <circle cx="12" cy="9" r="6" />
        <path d="m9 9 2 2 3-3M7 14l-2 7 7-3 7 3-2-7" />
      </>
    ),
    references: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 4v2" />
      </>
    ),
    appeals: (
      <>
        <path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0Z" />
        <path d="M12 7v5m0 3h.01" />
      </>
    ),
    holder: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M5 16a3 3 0 0 1 6 0m3-6h4m-4 4h4" />
      </>
    ),
    regulator: (
      <>
        <path d="M12 3 3 7l9 4 9-4-9-4Zm-7 8v7m7-3v6m7-10v7M3 21h18" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    moon: <path d="M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5z" />
        <path d="m8 11 3 3 5-6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4" />
      </>
    ),
    link: (
      <>
        <path d="m9 15 6-6m-7 3-2 2a4 4 0 0 0 6 6l2-2m-4-12 2-2a4 4 0 0 1 6 6l-2 2" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3m-4 4 4-4 4 4M4 15v6h16v-6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.shield}
    </svg>
  );
}

export function ExperienceProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const notify = useCallback((message, tone = "ok") => {
    clearTimeout(timer.current);
    setToast({ id: crypto.randomUUID(), message, tone });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ExperienceContext.Provider value={notify}>
      {children}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <span className="toast-icon">
              <Icon name={toast.tone === "ok" ? "check" : "info"} size={18} />
            </span>
            <p>{toast.message}</p>
            <button
              type="button"
              className="icon-button toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => {
                clearTimeout(timer.current);
                setToast(null);
              }}
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}
      </div>
    </ExperienceContext.Provider>
  );
}
export function useNotify() {
  return useContext(ExperienceContext);
}
export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("veridoc-theme");
      if (saved) return saved === "dark";
    } catch {
      /* The system preference still works when storage is unavailable. */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  function toggle() {
    setDark((value) => {
      const next = !value;
      try {
        localStorage.setItem("veridoc-theme", next ? "dark" : "light");
      } catch {
        /* Theme remains available for this session. */
      }
      return next;
    });
  }
  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
