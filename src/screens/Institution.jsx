import { useEffect, useState } from "react";
import { useWorkspace, AccessState } from "../components/Account.jsx";
import { Page, Stats, Tag, Field, Rosette } from "../components/UI.jsx";
import {
  SectionTabs,
  Empty,
  useMutation,
  EvidenceEditor,
} from "../components/WorkspaceUI.jsx";
import { FRAMEWORKS } from "../lib/frameworks.js";
export default function Institution() {
  const workspace = useWorkspace("institution"),
    [tab, setTab] = useState("overview"),
    [profile, setProfile] = useState({
      name: "",
      kind: "institution",
      scope: "",
      jurisdiction: "Nigeria",
      registration: "",
    }),
    [evidence, setEvidence] = useState([]),
    [credential, setCredential] = useState({
      reference: "",
      holder: "",
      title: "",
      issued: "",
    }),
    [query, setQuery] = useState("");
  const mutation = useMutation(workspace.reload);
  useEffect(() => {
    if (workspace.data?.profile) setProfile(workspace.data.profile);
  }, [workspace.data?.profile]);
  if (workspace.loading || workspace.error)
    return (
      <Page title="Institution">
        <AccessState {...workspace} />
      </Page>
    );
  const d = workspace.data,
    seal = d.seals[0]?.data,
    filtered = d.credentials.filter((row) =>
      Object.values(row.data)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  return (
    <Page title={profile.name || "Institution"}>
      <SectionTabs
        items={[
          ["overview", "Overview"],
          ["profile", "Profile"],
          ["credentials", "Credentials"],
          ["review", "Verification"],
          ["seal", "Trust Seal"],
          ["plan", "Plan"],
        ]}
        value={tab}
        onChange={setTab}
      />
      {mutation.feedback}
      {tab === "overview" && (
        <>
          <Stats
            items={[
              [seal ? `Grade ${seal.grade}` : "Not assessed", "Trust Seal"],
              [d.credentials.length, "Issued records"],
              [
                d.cases.filter(
                  (c) => !["Decision recorded"].includes(c.data.status),
                ).length,
                "Open requests",
              ],
            ]}
          />
          <div className="cols">
            <div className="card">
              <h3>Institution profile</h3>
              <p className="scope-text">
                {profile.scope ||
                  "Define the credential or business activity to be assessed."}
              </p>
              <div className="tags">
                <Tag tone="neutral">{FRAMEWORKS[profile.kind].singular}</Tag>
                <Tag tone="neutral">{profile.jurisdiction}</Tag>
              </div>
              <p className="note">
                Registration: {profile.registration || "Not provided"}
              </p>
              <button className="ghost mt" onClick={() => setTab("profile")}>
                Edit profile
              </button>
            </div>
            <div className="card">
              <h3>Verification requests</h3>
              {d.cases.length ? (
                d.cases.slice(0, 3).map((row) => (
                  <div className="ref" key={row.id}>
                    <div className="top">
                      <h4>{row.data.subject}</h4>
                      <Tag tone="neutral">{row.data.status}</Tag>
                    </div>
                    <p className="mono">{row.id}</p>
                  </div>
                ))
              ) : (
                <Empty title="No requests">
                  Submit evidence for an independent review.
                </Empty>
              )}
              <button className="ghost mt" onClick={() => setTab("review")}>
                Submit evidence
              </button>
            </div>
          </div>
        </>
      )}
      {tab === "profile" && (
        <div className="card mt">
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              await mutation.run(
                "/api/institution/profile",
                profile,
                "Institution profile saved.",
              );
            }}
          >
            {[
              ["name", "Organisation"],
              ["registration", "Registration reference"],
              ["jurisdiction", "Jurisdiction"],
            ].map(([key, label]) => (
              <Field label={label} key={key}>
                <input
                  type="text"
                  value={profile[key]}
                  required={key === "name"}
                  onChange={(e) =>
                    setProfile({ ...profile, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Assessment type">
              <select
                value={profile.kind}
                onChange={(e) =>
                  setProfile({ ...profile, kind: e.target.value })
                }
              >
                <option value="institution">Institution</option>
                <option value="business">Business</option>
              </select>
            </Field>
            <Field label="Scope to verify">
              <textarea
                required
                value={profile.scope}
                onChange={(e) =>
                  setProfile({ ...profile, scope: e.target.value })
                }
                placeholder="Credential category or operating activity, and its limits"
                maxLength={600}
              />
            </Field>
            <button className="btn-primary" disabled={mutation.busy}>
              Save profile
            </button>
          </form>
        </div>
      )}
      {tab === "credentials" && (
        <div className="card mt">
          <div className="section-heading">
            <h3>Credential register</h3>
            <Tag tone="neutral">Issuer-submitted</Tag>
          </div>
          <input
            type="text"
            aria-label="Search credentials"
            placeholder="Search credentials"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="full-input"
          />
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {[
                    "Reference",
                    "Holder",
                    "Credential",
                    "Issued",
                    "Status",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {["reference", "holder", "title", "issued", "status"].map(
                      (key) => (
                        <td key={key}>{row.data[key]}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <Empty title="No credential records" />}
          <form
            className="add"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutation.run(
                  "/api/institution/credentials",
                  credential,
                  "Credential registered.",
                )
              )
                setCredential({
                  reference: "",
                  holder: "",
                  title: "",
                  issued: "",
                });
            }}
          >
            {[
              ["reference", "Reference"],
              ["holder", "Holder"],
              ["title", "Credential"],
            ].map(([key, label]) => (
              <input
                type="text"
                required
                key={key}
                aria-label={label}
                placeholder={label}
                value={credential[key]}
                onChange={(e) =>
                  setCredential({ ...credential, [key]: e.target.value })
                }
              />
            ))}
            <button className="btn-primary" disabled={mutation.busy}>
              Register credential
            </button>
          </form>
          <p className="note">
            Registration records an issuer claim. It does not verify the
            credential.
          </p>
        </div>
      )}
      {tab === "review" && (
        <div className="cols">
          <div className="card">
            <h3>Request verification</h3>
            <div className="scope-card">
              <strong>{FRAMEWORKS[profile.kind].singular}</strong>
              <p>
                {profile.scope ||
                  "Set the verification scope in Profile first."}
              </p>
            </div>
            <EvidenceEditor
              items={evidence}
              setItems={setEvidence}
              categories={FRAMEWORKS[profile.kind].categories}
            />
            <button
              className="btn-primary"
              disabled={mutation.busy || !evidence.length}
              onClick={async () => {
                if (
                  await mutation.run(
                    "/api/institution/request-review",
                    { evidence },
                    "Verification requested.",
                  )
                )
                  setEvidence([]);
              }}
            >
              Submit for review
            </button>
          </div>
          <div className="card">
            <h3>Requests & decisions</h3>
            {d.cases.length ? (
              d.cases.map((row) => (
                <div className="ref" key={row.id}>
                  <div className="top">
                    <h4>{FRAMEWORKS[row.data.kind].singular}</h4>
                    <Tag tone="neutral">{row.data.status}</Tag>
                  </div>
                  <p>{row.data.scope}</p>
                  <p className="mono">{row.id}</p>
                  {row.data.assessment && (
                    <p>
                      Grade {row.data.assessment.grade} ·{" "}
                      {row.data.assessment.total}/100
                    </p>
                  )}
                </div>
              ))
            ) : (
              <Empty title="No requests" />
            )}
            <a className="text-link" href="#framework">
              View grading criteria
            </a>
            <a className="text-link block-link" href="#appeals">
              Challenge a decision
            </a>
          </div>
        </div>
      )}
      {tab === "seal" && (
        <div className="cols">
          <div className="card seal">
            <Rosette grade={seal?.grade ?? null} verified={Boolean(seal)} />
            <h3>
              {seal
                ? `Grade ${seal.grade}: ${FRAMEWORKS[seal.kind].grades[seal.grade]}`
                : "Assessment pending"}
            </h3>
            {seal ? (
              <>
                <p className="note">{seal.scope}</p>
                <a
                  className="button-link btn-primary mt"
                  href={`#seal/${seal.id}`}
                >
                  Open verification record
                </a>
              </>
            ) : (
              <>
                <p className="note">
                  A seal is issued only after independent evidence review.
                </p>
                <button className="ghost mt" onClick={() => setTab("review")}>
                  Request assessment
                </button>
              </>
            )}
          </div>
          <div className="card">
            <h3>Authority & recognition</h3>
            {d.confirmations.length ? (
              d.confirmations.map((row) => (
                <div className="ref" key={row.id}>
                  <strong>{row.data.body}</strong>
                  <p>Authority: {row.data.authority}</p>
                  <p>Accreditation: {row.data.accreditation}</p>
                  <p className="mono">{row.data.reference}</p>
                </div>
              ))
            ) : (
              <Empty title="No regulatory confirmations">
                Identity verification does not establish accreditation or
                statutory approval.
              </Empty>
            )}
            <a className="text-link" href="#framework">
              What each grade means
            </a>
          </div>
        </div>
      )}
      {tab === "plan" && (
        <>
          <div className="plan-policy">
            <strong>Grades cannot be bought.</strong>
            <span>
              Subscription features never enter the assessment calculation.
            </span>
          </div>
          <div className="cols eq">
            {[
              [
                "Free",
                "Core profile, credential records and access to evidence-based assessment.",
              ],
              [
                "Visibility",
                "Additional discovery, analytics and service tools. Billing is not connected.",
              ],
            ].map(([plan, description]) => (
              <div className="card" key={plan}>
                <div className="section-heading">
                  <h3>{plan}</h3>
                  <Tag tone="neutral">
                    {plan === "Free" ? "Current" : "Planned"}
                  </Tag>
                </div>
                <p className="note">{description}</p>
                <ul className="tick y">
                  <li>Same grading thresholds</li>
                  <li>Same evidence requirements</li>
                  <li>Same appeal rights</li>
                </ul>
                {plan === "Visibility" && (
                  <button
                    className="ghost mt"
                    disabled={mutation.busy}
                    onClick={() =>
                      mutation.run(
                        "/api/institution/plan",
                        { plan },
                        "Interest recorded. No payment taken.",
                      )
                    }
                  >
                    {d.plan.requested === "Visibility"
                      ? "Interest recorded"
                      : "Register interest"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
