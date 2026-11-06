import { useEffect, useState } from "react";
import { useWorkspace, AccessState } from "../components/Account.jsx";
import { Page, Stats, Tag, Details, Field, QR } from "../components/UI.jsx";
import { Icon } from "../components/Experience.jsx";
import {
  SectionTabs,
  Empty,
  useMutation,
  EvidenceEditor,
} from "../components/WorkspaceUI.jsx";
import { FRAMEWORKS } from "../lib/frameworks.js";
export default function Holder({ initialTab = "overview" }) {
  const workspace = useWorkspace("holder"),
    [tab, setTab] = useState(initialTab),
    [profile, setProfile] = useState({
      name: "",
      profession: "",
      location: "",
      bio: "",
    }),
    [qualification, setQualification] = useState({
      title: "",
      issuer: "",
      reference: "",
      issued: "",
      expires: "",
    }),
    [evidence, setEvidence] = useState([]),
    [selection, setSelection] = useState(""),
    [fields, setFields] = useState(["title", "issuer", "expires"]),
    [recipient, setRecipient] = useState(""),
    [purpose, setPurpose] = useState("Employment check"),
    [hours, setHours] = useState("168"),
    [consent, setConsent] = useState(false),
    [created, setCreated] = useState(null);
  const mutation = useMutation(workspace.reload);
  useEffect(() => {
    if (workspace.data?.profile) setProfile(workspace.data.profile);
  }, [workspace.data?.profile]);
  useEffect(() => setTab(initialTab), [initialTab]);
  if (workspace.loading || workspace.error)
    return (
      <Page title="My identity">
        <AccessState {...workspace} />
      </Page>
    );
  const d = workspace.data;
  const input = (key) => (e) =>
    setProfile({ ...profile, [key]: e.target.value });
  const qinput = (key) => (e) =>
    setQualification({ ...qualification, [key]: e.target.value });
  const selected =
    d.qualifications.find((q) => q.id === selection) || d.qualifications[0];
  const preview = selected
    ? [
        ["Status", selected.data.status],
        ...fields.map((key) => [
          {
            title: "Credential",
            issuer: "Issuer",
            issued: "Issued",
            expires: "Expires",
            reference: "Reference",
            name: "Holder",
          }[key],
          key === "name" ? profile.name : selected.data[key] || "Not provided",
        ]),
      ]
    : [];
  return (
    <Page title="My identity">
      <SectionTabs
        value={tab}
        onChange={setTab}
        items={[
          ["overview", "Overview"],
          ["profile", "Profile"],
          ["qualifications", "Qualifications"],
          ["opportunities", "Opportunities"],
          ["sharing", "Sharing"],
        ]}
      />
      {mutation.feedback}
      {tab === "overview" && (
        <>
          <Stats
            items={[
              [d.qualifications.length, "Qualifications"],
              [
                d.shares.filter(
                  (s) =>
                    !s.data.revoked && new Date(s.data.expiresAt) > new Date(),
                ).length,
                "Active shares",
              ],
              [d.saved.length, "Saved opportunities"],
            ]}
          />
          <div className="cols">
            <div className="card identity-card">
              <div className="profile-avatar">
                {profile.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <h3>{profile.name}</h3>
              <p>{profile.profession || "Add your profession"}</p>
              <p className="small-muted">
                {profile.location || "Location not added"}
              </p>
              <div className="profile-status">
                <Tag>Account authenticated</Tag>
                <Tag tone={d.seals?.length ? "ok" : "neutral"}>
                  {d.seals?.length
                    ? `Grade ${d.seals[0].data.grade}: ${FRAMEWORKS.individual.grades[d.seals[0].data.grade]}`
                    : "Identity not assessed"}
                </Tag>
              </div>
              {d.seals?.[0] && (
                <a
                  className="text-link block-link"
                  href={`#seal/${d.seals[0].id}`}
                >
                  View assessment record
                </a>
              )}
              <button className="ghost mt" onClick={() => setTab("profile")}>
                Edit profile
              </button>
            </div>
            <div className="card">
              <h3>Qualifications & standing</h3>
              {d.qualifications.length ? (
                d.qualifications.slice(0, 3).map((q) => (
                  <div className="ref" key={q.id}>
                    <div className="top">
                      <h4>{q.data.title}</h4>
                      <Tag tone="neutral">{q.data.status}</Tag>
                    </div>
                    <p>{q.data.issuer}</p>
                  </div>
                ))
              ) : (
                <Empty title="Build your credential record">
                  Add qualifications, then request a source-based assessment.
                </Empty>
              )}
              <button
                className="ghost mt"
                onClick={() => setTab("qualifications")}
              >
                Manage qualifications
              </button>
            </div>
          </div>
        </>
      )}
      {tab === "profile" && (
        <div className="card mt">
          <h3>Professional profile</h3>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              await mutation.run(
                "/api/holder/profile",
                profile,
                "Profile saved.",
              );
            }}
          >
            <Field label="Name">
              <input
                type="text"
                required
                value={profile.name}
                onChange={input("name")}
                maxLength={200}
              />
            </Field>
            <Field label="Profession">
              <input
                type="text"
                value={profile.profession}
                onChange={input("profession")}
                maxLength={200}
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={profile.location}
                onChange={input("location")}
                maxLength={200}
              />
            </Field>
            <Field label="About">
              <textarea
                value={profile.bio}
                onChange={input("bio")}
                maxLength={1200}
              />
            </Field>
            <button className="btn-primary" disabled={mutation.busy}>
              Save profile
            </button>
          </form>
        </div>
      )}
      {tab === "qualifications" && (
        <>
          <div className="cols">
            <div className="card">
              <h3>Your qualifications</h3>
              {d.qualifications.length ? (
                d.qualifications.map((q) => (
                  <div className="ref" key={q.id}>
                    <div className="top">
                      <h4>{q.data.title}</h4>
                      <Tag tone="neutral">{q.data.status}</Tag>
                    </div>
                    <p>
                      {q.data.issuer} ·{" "}
                      {q.data.reference || "No source reference"}
                    </p>
                  </div>
                ))
              ) : (
                <Empty title="No qualifications yet" />
              )}
            </div>
            <div className="card">
              <h3>Add qualification</h3>
              <form
                className="form single"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await mutation.run(
                      "/api/holder/qualifications",
                      qualification,
                      "Qualification added.",
                    )
                  )
                    setQualification({
                      title: "",
                      issuer: "",
                      reference: "",
                      issued: "",
                      expires: "",
                    });
                }}
              >
                {[
                  ["title", "Qualification"],
                  ["issuer", "Issuer"],
                  ["reference", "Source reference"],
                  ["issued", "Issue date"],
                  ["expires", "Expiry date"],
                ].map(([key, label]) => (
                  <Field label={label} key={key}>
                    <input
                      type="text"
                      required={key === "title" || key === "issuer"}
                      value={qualification[key]}
                      onChange={qinput(key)}
                      placeholder={
                        key === "issued" || key === "expires"
                          ? "YYYY-MM-DD"
                          : undefined
                      }
                    />
                  </Field>
                ))}
                <button className="btn-primary" disabled={mutation.busy}>
                  Add qualification
                </button>
              </form>
              <p className="note">
                Added claims remain self-declared until independently checked.
              </p>
            </div>
          </div>
          {d.assessments?.length > 0 && (
            <div className="card mb">
              <h3>Assessment requests</h3>
              {d.assessments.map((row) => (
                <div className="ref" key={row.id}>
                  <div className="top">
                    <span className="mono">{row.id}</span>
                    <Tag tone="neutral">{row.data.status}</Tag>
                  </div>
                  <a
                    className="text-link block-link"
                    href={`#appeals?reference=${encodeURIComponent(row.id)}`}
                  >
                    Challenge this assessment
                  </a>
                </div>
              ))}
            </div>
          )}
          <div className="card mb">
            <h3>Request an assessment</h3>
            <EvidenceEditor
              items={evidence}
              setItems={setEvidence}
              categories={FRAMEWORKS.individual.categories}
            />
            <button
              className="btn-primary"
              disabled={mutation.busy || !evidence.length}
              onClick={async () => {
                if (
                  await mutation.run(
                    "/api/holder/request-review",
                    { evidence },
                    "Assessment requested.",
                  )
                )
                  setEvidence([]);
              }}
            >
              Request review
            </button>
            <a className="text-link inline-link" href="#framework">
              Assessment criteria
            </a>
          </div>
        </>
      )}
      {tab === "opportunities" && (
        <>
          <div className="opportunity-heading">
            <Tag tone="neutral">Example opportunities</Tag>
            <span className="small-muted">No live job feed is connected.</span>
          </div>
          <div className="opportunity-grid">
            {d.opportunities.map((item) => {
              const saved = d.saved.some(
                (row) => row.data.opportunityId === item.id,
              );
              return (
                <article className="card opportunity-card" key={item.id}>
                  <span className="opportunity-type">{item.type}</span>
                  <h3>{item.title}</h3>
                  <p className="small-muted">{item.location}</p>
                  <div className="tags">
                    {item.tags.map((tag) => (
                      <Tag tone="neutral" key={tag}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <details className="disclosure">
                    <summary>Requirements</summary>
                    <p>{item.requirements}</p>
                  </details>
                  <button
                    className="ghost mt"
                    disabled={mutation.busy}
                    aria-pressed={saved}
                    onClick={() =>
                      mutation.run(
                        "/api/holder/opportunities",
                        { id: item.id, saved: !saved },
                        saved ? "Removed from saved." : "Opportunity saved.",
                      )
                    }
                  >
                    {saved ? "Saved" : "Save opportunity"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "sharing" && (
        <>
          <div className="cols">
            <div className="card">
              <h3>Create proof link</h3>
              {selected ? (
                <form
                  className="form single"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const result = await mutation.run(
                      "/api/holder/shares",
                      {
                        qualificationId: selected.id,
                        fields,
                        recipient,
                        purpose,
                        hours,
                        consent,
                      },
                      "Share link created.",
                    );
                    if (result) {
                      setCreated(result);
                      setConsent(false);
                    }
                  }}
                >
                  <Field label="Credential">
                    <select
                      value={selected.id}
                      onChange={(e) => setSelection(e.target.value)}
                    >
                      {d.qualifications.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.data.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <fieldset className="plain-fieldset">
                    <legend>Shared fields</legend>
                    {[
                      ["title", "Credential"],
                      ["issuer", "Issuer"],
                      ["issued", "Issue date"],
                      ["expires", "Expiry date"],
                      ["reference", "Reference"],
                      ["name", "Holder name"],
                    ].map(([key, label]) => (
                      <label className="gate" key={key}>
                        <input
                          type="checkbox"
                          checked={fields.includes(key)}
                          onChange={(e) =>
                            setFields(
                              e.target.checked
                                ? [...fields, key]
                                : fields.filter((f) => f !== key),
                            )
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <Field label="Recipient">
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </Field>
                  <Field label="Purpose">
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    >
                      {[
                        "Employment check",
                        "Education admission",
                        "Professional registration",
                        "Other",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Expires after">
                    <select
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    >
                      <option value="24">24 hours</option>
                      <option value="168">7 days</option>
                      <option value="720">30 days</option>
                    </select>
                  </Field>
                  <label className="gate">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Share selected fields for this purpose until expiry. I can
                      revoke access.
                    </span>
                  </label>
                  <button className="btn-primary" disabled={mutation.busy}>
                    Create link
                  </button>
                </form>
              ) : (
                <Empty title="Add a qualification first" />
              )}
            </div>
            <div>
              <div className="card">
                <h3>Recipient preview</h3>
                {selected ? (
                  <Details rows={preview} />
                ) : (
                  <p className="note">Select a qualification to preview.</p>
                )}
              </div>
              {created && (
                <div className="card mt">
                  <h3>Share link</h3>
                  <QR
                    value={`${window.location.origin}/#share/${created.id}`}
                  />
                  <a className="verification-url" href={`#share/${created.id}`}>
                    {window.location.origin}/#share/{created.id}
                  </a>
                  <p className="note">
                    Stored until expiry or revocation. Access follows site
                    sharing settings.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="card mb">
            <h3>Share history</h3>
            {d.shares.length ? (
              d.shares.map((row) => (
                <div className="ref" key={row.id}>
                  <div className="top">
                    <h4>{row.data.recipient || "Unnamed recipient"}</h4>
                    <Tag tone="neutral">
                      {row.data.revoked
                        ? "Revoked"
                        : new Date(row.data.expiresAt) > new Date()
                          ? "Active"
                          : "Expired"}
                    </Tag>
                  </div>
                  <p>
                    {row.data.purpose} · Expires{" "}
                    {new Date(row.data.expiresAt).toLocaleString("en-GB")}
                  </p>
                  {!row.data.revoked && (
                    <button
                      className="ghost"
                      disabled={mutation.busy}
                      onClick={() =>
                        mutation.run(
                          "/api/holder/revoke",
                          { id: row.id },
                          "Link revoked.",
                        )
                      }
                    >
                      Revoke link
                    </button>
                  )}
                </div>
              ))
            ) : (
              <Empty title="No share links" />
            )}
          </div>
        </>
      )}
    </Page>
  );
}
