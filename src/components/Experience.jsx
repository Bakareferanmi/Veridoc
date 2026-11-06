import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Award01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  CloudUploadIcon,
  Download04Icon,
  File01Icon,
  HelpCircleIcon,
  IdCardIcon,
  InformationCircleIcon,
  JusticeScale01Icon,
  Link01Icon,
  MessageQuestionIcon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  NotEqualSignIcon,
  QrCodeScanIcon,
  Search01Icon,
  Shield01Icon,
  Sun03Icon,
  Task01Icon,
  Tick02Icon,
  UniversityIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ExperienceContext = createContext(null);

const icons = {
  more: MoreHorizontalIcon,
  check: Tick02Icon,
  close: Cancel01Icon,
  search: Search01Icon,
  qr: QrCodeScanIcon,
  document: File01Icon,
  institution: UniversityIcon,
  review: Task01Icon,
  seal: Award01Icon,
  opportunities: Briefcase01Icon,
  references: UserGroupIcon,
  appeals: MessageQuestionIcon,
  holder: IdCardIcon,
  regulator: JusticeScale01Icon,
  user: UserIcon,
  moon: Moon02Icon,
  sun: Sun03Icon,
  shield: Shield01Icon,
  download: Download04Icon,
  link: Link01Icon,
  upload: CloudUploadIcon,
  info: InformationCircleIcon,
  alert: Alert01Icon,
  help: HelpCircleIcon,
  minus: MinusSignIcon,
  mismatch: NotEqualSignIcon,
};

export function Icon({ name, size = 20, ...props }) {
  return (
    <HugeiconsIcon
      icon={icons[name] || icons.shield}
      size={size}
      color="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      {...props}
    />
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
