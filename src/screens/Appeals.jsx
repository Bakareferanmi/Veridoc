import { useEffect, useState } from "react";
import { api } from "../components/Account.jsx";
import { Page, Tag, Field, ErrorText } from "../components/UI.jsx";
import { Empty, useMutation } from "../components/WorkspaceUI.jsx";
export default function Appeals({ reference = "" }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [form, setForm] = useState({ reference, type: "Appeal", description: "" });
  async function reload() {
    try {
      setRows((await api("/api/appeals")).appeals);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  const mutation = useMutation(reload);
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => setForm((f) => ({ ...f, reference })), [reference]);
  return (
    <Page title="Corrections & appeals">
      <ErrorText>{error || mutation.error}</ErrorText>
      <div className="cols">
        <div className="card">
          <h3>Your requests</h3>
          {rows.length ? (
            rows.map((row) => (
              <div className="ref" key={row.id}>
                <div className="top">
                  <h4>
                    {row.data.type}: {row.data.reference}
                  </h4>
                  <Tag tone="warn">{row.data.status}</Tag>
                </div>
                <div
                  className="prog"
                  aria-label="Received; independent review pending"
                >
                  {row.data.steps.map((step, i) => (
                    <i className={i === 0 ? "on" : ""} key={step} />
                  ))}
                </div>
                <p>{row.data.description}</p>
                <p className="small-muted">
                  {new Date(row.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))
          ) : (
            <Empty title="No appeals submitted" />
          )}
          <details className="disclosure">
            <summary>Review process</summary>
            <ol>
              <li>Request received</li>
              <li>Different reviewer assigned</li>
              <li>Source evidence rechecked</li>
              <li>Reasoned outcome published</li>
            </ol>
            <p>The original reviewer cannot decide their own appeal.</p>
          </details>
        </div>
        <div className="card">
          <h3>New request</h3>
          <form
            className="form single"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutation.run("/api/appeals", form, "Request submitted.")
              )
                setForm({ ...form, description: "" });
            }}
          >
            <Field label="Assessment reference">
              <input
                type="text"
                required
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                placeholder="VDC-VER-…"
              />
            </Field>
            <Field label="Request type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Appeal</option>
                <option>Correction</option>
              </select>
            </Field>
            <Field label="Issue and new evidence">
              <textarea
                required
                value={form.description}
                maxLength={4000}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
            <button className="btn-primary" disabled={mutation.busy}>
              Submit request
            </button>
          </form>
        </div>
      </div>
    </Page>
  );
}
