import { useState } from "react";
import { useNotify } from "../components/Experience.jsx";
import { HC, FLD, SH, HL } from "../data.js";
import {
  Audit,
  Details,
  ErrorText,
  Field,
  Page,
  QR,
  Tag,
} from "../components/UI.jsx";
import { now } from "../lib/assessment.js";
export default function Holder({ shares, setShares }) {
  const notify = useNotify();
  const [credential, setCredential] = useState(0),
    [fields, setFields] = useState(FLD.map((item) => Boolean(item[1]))),
    [recipient, setRecipient] = useState(""),
    [purpose, setPurpose] = useState("Employment check"),
    [duration, setDuration] = useState("24"),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [link, setLink] = useState(""),
    [copyLabel, setCopyLabel] = useState("Copy link"),
    [activity, setActivity] = useState(HL),
    [examples, setExamples] = useState(SH);
  const rows = [
    ["Status", HC[credential].st],
    ...FLD.filter((_, i) => fields[i]).map((item) => [
      item[2],
      HC[credential][item[3]],
    ]),
  ];
  const hidden = FLD.filter((_, i) => !fields[i]).map((item) =>
    item[0].toLowerCase(),
  );
  function log(text) {
    setActivity((items) => [[text, now()], ...items]);
  }
  function create(event) {
    event.preventDefault();
    if (!consent) return setError("Confirm consent to share.");
    const token = crypto.randomUUID(),
      to = recipient.trim() || "Unnamed recipient",
      expires = Date.now() + Number(duration) * 36e5;
    const item = {
      token,
      to,
      p: purpose,
      f: [
        "Status",
        ...FLD.filter((_, i) => fields[i]).map((item) => item[0]),
      ].join(", "),
      e: new Date(expires).toLocaleString("en-GB"),
      expires,
      s: "Active",
      rows,
    };
    setShares((items) => [item, ...items]);
    setLink(
      `${window.location.origin}${window.location.pathname}#share/${token}`,
    );
    setCopyLabel("Copy link");
    setRecipient("");
    setConsent(false);
    setError("");
    log(`Link created for ${to} (${purpose})`);
    notify("Share preview created.");
  }
  function revoke(item, example) {
    if (example)
      setExamples((items) =>
        items.map((value) =>
          value === item ? { ...value, s: "Revoked" } : value,
        ),
      );
    else
      setShares((items) =>
        items.map((value) =>
          value.token === item.token ? { ...value, s: "Revoked" } : value,
        ),
      );
    log(`Link revoked for ${item.to}`);
    notify(`Share link revoked for ${item.to}.`);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyLabel("Copied");
      notify("Link copied.");
    } catch {
      setCopyLabel("Copy manually");
      notify("Select and copy the link.", "info");
    }
  }
  return (
    <Page title="My credentials">
      <div className="cols">
        <div>
          <div className="card mb-sm">
            <h3>1. Credential</h3>
            {HC.map((item, i) => (
              <label className="gate" key={item.t}>
                <input
                  type="radio"
                  name="credential"
                  checked={credential === i}
                  onChange={() => setCredential(i)}
                />
                <span>
                  {item.t}
                  <small>{item.st}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="card mb-sm">
            <h3>2. Shared details</h3>
            <label className="gate">
              <input type="checkbox" checked disabled />
              <span>Status (required)</span>
            </label>
            {FLD.map((item, i) => (
              <label className="gate" key={item[0]}>
                <input
                  type="checkbox"
                  checked={fields[i]}
                  onChange={(event) =>
                    setFields(
                      fields.map((value, j) =>
                        i === j ? event.target.checked : value,
                      ),
                    )
                  }
                />
                <span>{item[0]}</span>
              </label>
            ))}
          </div>
          <div className="card">
            <h3>3. Sharing</h3>
            <form className="form single" onSubmit={create} noValidate>
              <Field label="Recipient (optional)">
                <input
                  type="text"
                  placeholder="Employer or organisation"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </Field>
              <Field label="Purpose">
                <select
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                >
                  {[
                    "Employment check",
                    "Education admission",
                    "Professional registration",
                    "Other",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Expires after">
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                >
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                  <option value="720">30 days</option>
                </select>
              </Field>
              <label className="gate consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                <span>
                  Share these details for the selected purpose until expiry. I
                  can revoke access.
                </span>
              </label>
              <button className="btn-primary">Create link</button>
            </form>
            <ErrorText>{error}</ErrorText>
          </div>
        </div>
        <div>
          <div className="card">
            <h3>Recipient preview</h3>
            <Details rows={rows} />
            <p className="note">
              {hidden.length
                ? `Hidden: ${hidden.join(", ")}.`
                : "Nothing is hidden."}
            </p>
          </div>
          {link && (
            <div className="card seal mt">
              <h3>Share link</h3>
              <div className="src mono share-url">
                <a href={link}>{link}</a>
              </div>
              <QR value={link} />
              <div className="actions centered">
                <button className="ghost" onClick={copy}>
                  {copyLabel}
                </button>
              </div>
              <p className="note">
                Preview only. Works in this tab until refresh.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="cols eq">
        <div className="card">
          <h3>Share links</h3>
          {[...shares, ...examples].map((item, i) => {
            const status =
              item.expires && item.expires <= Date.now() && item.s === "Active"
                ? "Expired"
                : item.s;
            return (
              <div className="ref" key={item.token || i}>
                <div className="top">
                  <h4>{item.to}</h4>
                  <Tag tone={status === "Active" ? "ok" : "neutral"}>
                    {status}
                  </Tag>
                </div>
                <p>
                  {item.p} · {item.f.toLowerCase()}
                </p>
                <p>Expires {item.e}.</p>
                {status === "Active" && (
                  <button
                    className="ghost"
                    onClick={() => revoke(item, !item.token)}
                  >
                    Revoke link
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3>Activity</h3>
          <Audit items={activity} />
        </div>
      </div>
    </Page>
  );
}
