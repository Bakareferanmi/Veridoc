import { useState } from "react";
import { useNotify } from "./Experience.jsx";
import { api } from "./Account.jsx";
import { ErrorText } from "./UI.jsx";
export function focusSection(id) {
  requestAnimationFrame(() => {
    const section = document.getElementById(id);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start", behavior: "auto" });
  });
}
export function SectionTabs({ items, value, onChange }) {
  return (
    <div className="section-tabs" role="group" aria-label="Workspace section">
      {items.map(([id, label]) => (
        <button
          key={id}
          className="section-tab"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty-state">
      <h4>{title}</h4>
      {children && <p>{children}</p>}
    </div>
  );
}
export function useMutation(reload) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const notify = useNotify();
  async function run(path, body, message) {
    setBusy(true);
    setError("");
    try {
      const result = await api(path, body);
      await reload?.();
      if (message) notify(message);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error, feedback: <ErrorText>{error}</ErrorText> };
}
export function EvidenceEditor({ items, setItems, categories }) {
  const [category, setCategory] = useState("0"),
    [title, setTitle] = useState(""),
    [reference, setReference] = useState("");
  return (
    <>
      <div className="evidence-entry">
        <label className="fld">
          Criterion
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(([name], i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="fld">
          Evidence
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Registration record"
          />
        </label>
        <label className="fld">
          Source reference
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Record or secure document reference"
          />
        </label>
        <button
          className="ghost"
          type="button"
          disabled={!title.trim() || !reference.trim() || items.length >= 20}
          onClick={() => {
            setItems([
              ...items,
              { category: Number(category), title, reference },
            ]);
            setTitle("");
            setReference("");
          }}
        >
          Add evidence
        </button>
      </div>
      <ul className="axis">
        {items.map((item, i) => (
          <li key={i}>
            <div>
              {item.title}
              <small>
                {categories[item.category][0]} · {item.reference}
              </small>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => setItems(items.filter((_, j) => i !== j))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="note">
        Use source references. Do not enter identity-document numbers.
      </p>
    </>
  );
}
