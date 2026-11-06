import { useState } from "react";
import { useWorkspace, AccessState } from "../components/Account.jsx";
import { Page, Stats, Tag, Field } from "../components/UI.jsx";
import { Empty, useMutation } from "../components/WorkspaceUI.jsx";
export default function Regulator() {
  const workspace = useWorkspace("regulator"),
    mutation = useMutation(workspace.reload);
  const [selected, setSelected] = useState(""),
    [body, setBody] = useState(""),
    [reference, setReference] = useState(""),
    [authority, setAuthority] = useState("Confirmed"),
    [accreditation, setAccreditation] = useState("Not confirmed");
  if (workspace.loading || workspace.error)
    return (
      <Page title="Regulator">
        <AccessState {...workspace} />
      </Page>
    );
  const d = workspace.data;
  return (
    <Page title="Regulator">
      <div className="section-heading">
        <Tag tone="neutral">
          {d.scope === "*" ? "Assigned oversight" : d.scope}
        </Tag>
        <a className="text-link" href="#framework">
          Assessment policy
        </a>
      </div>
      <Stats
        items={[
          [d.records.length, "Verification records"],
          [d.confirmations.length, "Confirmations"],
          [
            d.records.filter((r) => r.data.status === "Second review required")
              .length,
            "Escalated cases",
          ],
        ]}
      />
      {mutation.feedback}
      <div className="cols">
        <div className="card">
          <h3>Institutional verification records</h3>
          {d.records.length ? (
            d.records.map((row) => (
              <div className="ref" key={row.id}>
                <div className="top">
                  <h4>{row.data.subject}</h4>
                  <Tag tone="neutral">{row.data.status}</Tag>
                </div>
                <p>
                  {row.data.scope} · {row.data.jurisdiction}
                </p>
                <p className="mono">{row.id}</p>
                <details className="disclosure">
                  <summary>Evidence references</summary>
                  {row.data.evidence.map((item, i) => (
                    <p key={i}>
                      {item.title} · {item.reference}
                    </p>
                  ))}
                </details>
                <button className="ghost" onClick={() => setSelected(row.id)}>
                  Record confirmation
                </button>
              </div>
            ))
          ) : (
            <Empty title="No oversight records">
              Institution verification requests will appear within your assigned
              jurisdiction.
            </Empty>
          )}
        </div>
        <div className="card">
          <h3>Authority & accreditation</h3>
          <form
            className="form single"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutation.run(
                  "/api/regulator/confirm",
                  { id: selected, body, reference, authority, accreditation },
                  "Confirmation recorded.",
                )
              )
                setReference("");
            }}
          >
            <Field label="Verification case">
              <select
                required
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Select a case</option>
                {d.records.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.data.subject}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Authority or professional body">
              <input
                type="text"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <Field label="Source reference">
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
            <Field label="Issuing / operating authority">
              <select
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
              >
                <option>Confirmed</option>
                <option>Declined</option>
              </select>
            </Field>
            <Field label="Accreditation">
              <select
                value={accreditation}
                onChange={(e) => setAccreditation(e.target.value)}
              >
                <option>Not confirmed</option>
                <option>Confirmed</option>
              </select>
            </Field>
            <button
              className="btn-primary"
              disabled={mutation.busy || !selected}
            >
              Record confirmation
            </button>
          </form>
          <p className="note">
            Source-backed confirmations are recorded separately. They do not
            automatically raise a grade.
          </p>
        </div>
      </div>
      <div className="card mb">
        <h3>Confirmation history</h3>
        {d.confirmations.length ? (
          d.confirmations.map((row) => (
            <div className="ref" key={row.id}>
              <div className="top">
                <h4>{row.data.institution}</h4>
                <Tag tone="neutral">{row.data.authority}</Tag>
              </div>
              <p>
                {row.data.body} · {row.data.reference}
              </p>
              <p>Accreditation: {row.data.accreditation}</p>
            </div>
          ))
        ) : (
          <Empty title="No confirmations yet" />
        )}
      </div>
    </Page>
  );
}
