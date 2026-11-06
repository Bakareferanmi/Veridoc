import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
const AccountContext = createContext(null);
export async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Service unavailable." }));
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : data.message || "Request failed.",
    );
  return data;
}
export function AccountProvider({ children }) {
  const [session, setSession] = useState({
      user: null,
      roles: [],
      isAdmin: false,
      authMode: import.meta.env.VERIDOC_STANDALONE ? "standalone" : "chatgpt",
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setSession(await api("/api/session"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return (
    <AccountContext.Provider value={{ ...session, loading, error, reload }}>
      {children}
    </AccountContext.Provider>
  );
}
export function useAccount() {
  return useContext(AccountContext);
}
export function useWorkspace(role) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      setData(await api(`/api/workspaces/${role}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [role]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload };
}
export function AccessState({ loading, error }) {
  return loading ? (
    <div className="card loading-state" role="status">
      Loading workspace…
    </div>
  ) : error ? (
    <div className="card field-error" role="alert">
      {error}
    </div>
  ) : null;
}
