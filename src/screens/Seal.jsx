import { useEffect, useState } from "react";
import { EXAMPLE_SEAL, FRAMEWORKS } from "../lib/frameworks.js";
import { Banner, Details, Page, QR, Rosette, Tag } from "../components/UI.jsx";
import { Icon, useNotify } from "../components/Experience.jsx";
import { api } from "../components/Account.jsx";
const date = (value) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export default function Seal({ reference = EXAMPLE_SEAL.id }) {
  const [seal, setSeal] = useState(
      reference === EXAMPLE_SEAL.id ? EXAMPLE_SEAL : null,
    ),
    [error, setError] = useState("");
  const notify = useNotify();
  useEffect(() => {
    let active = true;
    api(`/api/public/seals/${encodeURIComponent(reference)}`)
      .then((data) => {
        if (active) {
          setSeal(data);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [reference]);
  if (!seal)
    return (
      <Page title="Trust Seal">
        <div className="card mt">{error || "Loading verification…"}</div>
      </Page>
    );
  const current =
    seal.status === "Active" &&
    new Date(seal.reviewAt) >= new Date(new Date().toISOString().slice(0, 10));
  const url = `${window.location.origin}/#seal/${encodeURIComponent(seal.id)}`;
  async function share() {
    try {
      await navigator.clipboard.writeText(url);
      notify("Verification link copied.");
    } catch {
      notify("Select the verification link to copy.", "info");
    }
  }
  return (
    <Page title="Trust Seal">
      <div className="seal-heading">
        <span className="mono">{seal.id}</span>
        {seal.example && <Tag tone="neutral">Example record</Tag>}
      </div>
      <div className="cols">
        <div className="card">
          <Banner
            title={
              current
                ? "Active"
                : seal.status === "Active"
                  ? "Review overdue"
                  : seal.status
            }
            tone={current ? "ok" : "warn"}
            icon={current ? "✓" : "!"}
          >
            {seal.institution}
          </Banner>
          <Details
            rows={[
              [
                "Grade",
                `Grade ${seal.grade}: ${FRAMEWORKS[seal.kind].grades[seal.grade]}`,
              ],
              ["Verification reference", seal.verificationReference],
              ["Verified", date(seal.verifiedAt)],
              ["Next review", date(seal.reviewAt)],
              ["Jurisdiction", seal.jurisdiction],
            ]}
          />
          <div className="scope-card">
            <h3>Verified scope</h3>
            <p>{seal.scope}</p>
          </div>
          <ul className="axis assurance-dimensions">
            {[
              [
                seal.kind === "individual"
                  ? "Identity"
                  : "Institution identity",
                seal.identity,
                "ok",
              ],
              [
                seal.kind === "individual"
                  ? "Qualifications"
                  : seal.kind === "business"
                    ? "Operating authority"
                    : "Issuing authority",
                seal.authority,
                seal.grade >= 2 ? "ok" : "neutral",
              ],
              ["Accreditation", seal.accreditation, "neutral"],
              ["Regulatory recognition", seal.regulatoryRecognition, "neutral"],
            ].map(([label, status, tone]) => (
              <li key={label}>
                <span>{label}</span>
                <Tag tone={tone}>{status}</Tag>
              </li>
            ))}
          </ul>
          <a className="text-link" href="#framework">
            Grade criteria <Icon name="document" size={16} />
          </a>
        </div>
        <aside className="card seal">
          <Rosette grade={seal.grade} />
          <h3>{seal.institution}</h3>
          <div className="id">{seal.verificationReference}</div>
          <QR value={url} />
          <button className="btn-primary" onClick={share}>
            <Icon name="link" size={18} />
            Share verification
          </button>
          <a className="verification-url" href={url}>
            {url}
          </a>
          <p className="note">
            QR opens this record. Access follows the site’s sharing settings.
          </p>
        </aside>
      </div>
      <div className="cols eq">
        <div className="card">
          <h3>Evidence reviewed</h3>
          <ul className="axis">
            {seal.evidence.map((item, i) => (
              <li key={i}>
                <div>
                  {item.name}
                  <small>{item.source}</small>
                </div>
                <span className="small-muted">{date(item.date)}</span>
              </li>
            ))}
          </ul>
          <span className="small-muted">Framework {seal.frameworkVersion}</span>
        </div>
        <div className="card">
          <h3>What this seal means</h3>
          <p className="note">
            Identity and authority are verified only within the stated scope. A
            grade does not confer accreditation, a statutory licence or approval
            of every credential.
          </p>
          <div className="actions mt">
            <a className="button-link ghost" href="#verify">
              Check a credential
            </a>
            <a
              className="button-link ghost"
              href={`#appeals?reference=${encodeURIComponent(seal.verificationReference)}`}
            >
              Request a correction
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
}
