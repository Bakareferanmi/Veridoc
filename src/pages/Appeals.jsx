import { useState } from "react";
import { useNotify } from "../components/Experience.jsx";
import { AP, AS } from "../data.js";
import { Banner, ErrorText, Field, Page, Tag } from "../components/UI.jsx";
import { today } from "../lib/assessment.js";
export default function Appeals() {
  const notify = useNotify();
  const [requests, setRequests] = useState(AP),
    [type, setType] = useState("Appeal a decision"),
    [area, setArea] = useState("Institutional identity"),
    [evidence, setEvidence] = useState(""),
    [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    if (!evidence.trim()) return setError("Describe the issue and evidence.");
    setRequests([
      { t: type, a: area, evidence: evidence.trim(), s: 0, d: today() },
      ...requests,
    ]);
    setEvidence("");
    notify("Request submitted.");
    setError("");
  }
  return (
    <Page title="Appeals">
      <div className="cols">
        <div>
          <div className="card mb-sm">
            <h3>Current decision</h3>
            <Banner tone="warn" icon="1" title="Grade 1: Identity Verified">
              Missing authority evidence for Site Supervisor certificates.
            </Banner>
          </div>
          <div className="card">
            <h3>Your requests</h3>
            <div aria-live="polite">
              {requests.map((request, i) => (
                <div className="ref" key={i}>
                  <div className="top">
                    <h4>
                      {request.t}: {request.a}
                    </h4>
                    <Tag tone={request.s >= 3 ? "ok" : "warn"}>
                      {request.s >= 3 ? "Closed" : "Open"}
                    </Tag>
                  </div>
                  <div className="prog" aria-hidden="true">
                    {AS.map((label, index) => (
                      <i
                        key={label}
                        className={index <= request.s ? "on" : ""}
                      />
                    ))}
                  </div>
                  <p>
                    {request.s + 1}/4 · {AS[request.s]} · {request.d}
                  </p>
                  {request.evidence && <p>{request.evidence}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>New request</h3>
          <form className="form single" onSubmit={submit} noValidate>
            <Field label="Request type">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option>Appeal a decision</option>
                <option>Correct a factual error</option>
              </select>
            </Field>
            <Field label="Area disputed">
              <select
                value={area}
                onChange={(event) => setArea(event.target.value)}
              >
                {[
                  "Institutional identity",
                  "Issuing authority",
                  "Credential record integrity",
                  "Governance and accountability",
                  "Digital and security controls",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="Issue and evidence">
              <textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
              />
            </Field>
            <button className="btn-primary">Submit request</button>
          </form>
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    </Page>
  );
}
