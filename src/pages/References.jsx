import { useState } from "react";
import { useNotify } from "../components/Experience.jsx";
import { RF } from "../data.js";
import {
  Checks,
  ErrorText,
  Field,
  Page,
  Stats,
  Tag,
} from "../components/UI.jsx";
import { today } from "../lib/assessment.js";
const empty = {
  n: "",
  o: "",
  r: "Regulator or local authority",
  f: "",
  c: "None declared",
};
export default function References() {
  const notify = useNotify();
  const [references, setReferences] = useState(RF),
    [form, setForm] = useState(empty),
    [error, setError] = useState("");
  const verified = references.filter((item) => item.v),
    independent = new Set(verified.map((item) => item.o.trim().toLowerCase()));
  const seen = new Set();
  const change = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  function submit(event) {
    event.preventDefault();
    if (!form.n.trim() || !form.o.trim() || !form.f.trim())
      return setError("Enter the referee, organisation and evidence.");
    setReferences([
      ...references,
      {
        ...form,
        n: form.n.trim(),
        o: form.o.trim(),
        f: form.f.trim(),
        d: today(),
        v: 0,
      },
    ]);
    setForm(empty);
    notify("Reference submitted.");
    setError("");
  }
  return (
    <Page title="References">
      <Stats
        items={[
          [references.length, "Received"],
          [verified.length, "Verified"],
          [independent.size, "Sources"],
        ]}
      />
      <div className="cols">
        <div className="card">
          {references.map((item, i) => {
            const key = item.o.trim().toLowerCase(),
              duplicate = item.v && seen.has(key);
            if (item.v) seen.add(key);
            return (
              <div className="ref" key={i}>
                <div className="top">
                  <h4>
                    {item.n}, {item.o}
                  </h4>
                  <div className="tags">
                    <Tag tone={item.v ? "ok" : "warn"}>
                      {item.v ? "Verified" : "Awaiting check"}
                    </Tag>
                    {item.c !== "None declared" && (
                      <Tag tone="warn">{item.c}</Tag>
                    )}
                    {duplicate && <Tag tone="neutral">Duplicate source</Tag>}
                  </div>
                </div>
                <p>{item.f}</p>
                <p>
                  {item.r} · {item.d}
                </p>
                {!item.v && (
                  <button
                    className="ghost"
                    onClick={() => {
                      notify("Reference verified.");
                      setReferences(
                        references.map((ref, j) =>
                          i === j ? { ...ref, v: 1 } : ref,
                        ),
                      );
                    }}
                  >
                    Verify reference
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <details className="card mb-sm disclosure-card">
            <summary>Reference rules</summary>
            <p>One count per independent source.</p>
            <Checks
              positive={false}
              items={[
                "Endorsements or testimonials",
                "Follower or member counts",
                "Paid memberships",
                "Several references from the same source",
              ]}
            />
          </details>
          <div className="card">
            <h3>Add reference</h3>
            <form className="form single" onSubmit={submit} noValidate>
              <Field label="Referee name">
                <input type="text" value={form.n} onChange={change("n")} />
              </Field>
              <Field label="Organisation">
                <input type="text" value={form.o} onChange={change("o")} />
              </Field>
              <Field label="Relationship">
                <select value={form.r} onChange={change("r")}>
                  {[
                    "Regulator or local authority",
                    "Professional association",
                    "Educational institution",
                    "Community organisation",
                    "Established partner",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Evidence">
                <textarea value={form.f} onChange={change("f")} />
              </Field>
              <Field label="Connection">
                <select value={form.c} onChange={change("c")}>
                  {[
                    "None declared",
                    "Financial connection",
                    "Personal connection",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <button className="btn-primary">Submit reference</button>
            </form>
            <ErrorText>{error}</ErrorText>
          </div>
        </div>
      </div>
    </Page>
  );
}
