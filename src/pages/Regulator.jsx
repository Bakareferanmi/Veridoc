import { useState } from "react";
import { useNotify } from "../components/Experience.jsx";
import { RQ } from "../data.js";
import {
  Audit,
  ErrorText,
  Field,
  Page,
  Stats,
  Tag,
} from "../components/UI.jsx";
import { now } from "../lib/assessment.js";
export default function Regulator() {
  const notify = useNotify();
  const [requests, setRequests] = useState(RQ),
    [records, setRecords] = useState([]),
    [audit, setAudit] = useState([["Workspace opened", now()]]),
    [reference, setReference] = useState(""),
    [status, setStatus] = useState("Valid"),
    [error, setError] = useState("");
  function log(text) {
    setAudit((items) => [[text, now()], ...items]);
  }
  function confirm(i, status) {
    notify(
      status === "Declined" ? "Request declined." : "Authority confirmed.",
    );
    setRequests(
      requests.map((request, j) =>
        i === j ? { ...request, s: status } : request,
      ),
    );
    log(`${status}: ${requests[i].i}, ${requests[i].c}`);
  }
  function submit(event) {
    event.preventDefault();
    if (!reference.trim()) return setError("Enter the credential reference.");
    setRecords([[reference.trim(), status], ...records]);
    log(
      `Status record submitted: ${reference.trim()} is ${status.toLowerCase()}`,
    );
    setReference("");
    notify("Status saved.");
    setError("");
  }
  return (
    <Page title="Regulator">
      <Stats
        items={[
          [requests.filter((item) => !item.s).length, "Pending"],
          [
            requests.filter((item) => item.s && item.s !== "Declined").length,
            "Scopes confirmed",
          ],
          [records.length, "Status records"],
        ]}
      />
      <div className="cols">
        <div className="card">
          <h3>Authority & accreditation</h3>
          {requests.map((request, i) => (
            <div className="ref" key={request.i}>
              <div className="top">
                <h4>{request.i}</h4>
                <Tag
                  tone={
                    !request.s
                      ? "warn"
                      : request.s === "Declined"
                        ? "bad"
                        : "ok"
                  }
                >
                  {request.s || "Awaiting you"}
                </Tag>
              </div>
              <p>
                {request.c} · {request.j}
              </p>
              <details className="disclosure">
                <summary>Evidence</summary>
                <p>{request.b}.</p>
              </details>
              {!request.s ? (
                <div className="actions mt-small">
                  {[
                    ["Confirm authority", "Confirmed"],
                    ["Confirm both", "Confirmed with accreditation"],
                    ["Decline", "Declined"],
                  ].map(([label, value], j) => (
                    <button
                      className={j === 0 ? "btn-primary" : "ghost"}
                      key={value}
                      onClick={() => confirm(i, value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <p>
                  {request.s === "Declined"
                    ? "Authority not confirmed."
                    : `Accreditation: ${request.s === "Confirmed" ? "unconfirmed." : "confirmed."}`}
                </p>
              )}
            </div>
          ))}
        </div>
        <div>
          <div className="card mb-sm">
            <h3>Status record</h3>
            <form className="form single" onSubmit={submit} noValidate>
              <Field label="Credential reference">
                <input
                  type="text"
                  placeholder="VDC-CR-00000"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {["Valid", "Suspended", "Revoked"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <button className="btn-primary">Save status</button>
            </form>
            <ErrorText>{error}</ErrorText>
            <ul className="axis">
              {records.map(([ref, status], i) => (
                <li key={i}>
                  <span className="mono">{ref}</span>
                  <Tag tone={status === "Valid" ? "ok" : "bad"}>{status}</Tag>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Activity</h3>
            <Audit items={audit} />
          </div>
        </div>
      </div>
    </Page>
  );
}
