import { useState } from "react";
import { ST } from "../data.js";
import { Banner, Checks, Details, Page, QR } from "../components/UI.jsx";
export default function Seal() {
  const [status, setStatus] = useState("active"),
    data = ST[status];
  return (
    <Page title="Trust seal">
      <div className="samples" role="group" aria-label="Seal status">
        <span className="samples-label">Status</span>
        {Object.entries(ST).map(([key, value]) => (
          <button
            className="chip"
            key={key}
            aria-pressed={status === key}
            onClick={() => setStatus(key)}
          >
            {value[2]}
          </button>
        ))}
      </div>
      <div className="cols">
        <div className="card">
          <Banner tone={data[0].slice(2)} icon={data[1]} title={data[2]}>
            {status !== "active" ? data[3] : null}
          </Banner>
          <Details
            rows={[
              ["Institution", "ABC Technical Learning Centre"],
              ["Seal grade", "Grade 2: Issuing Authority Verified"],
              ["Verified scope", "Short-course certificates"],
              ["Identity", "Verified"],
              ["Accreditation", "Not claimed"],
              [
                "Evidence route",
                "Registration, site review, reference, issuer records",
              ],
              ["Issued", "12 Mar 2027"],
              ["Next review", "12 Mar 2028"],
            ]}
          />
        </div>
        <aside className="card seal">
          <QR
            value={`${window.location.origin}${window.location.pathname}#seal`}
          />
          <h3>Live status</h3>
        </aside>
      </div>
      <div className="cols eq">
        <div className="card">
          <h3>Confirms</h3>
          <Checks
            items={[
              "Institution identity",
              "Issuing authority",
              "Evidence and review date",
            ]}
          />
        </div>
        <div className="card">
          <h3>Excludes</h3>
          <Checks
            positive={false}
            items={[
              "Accreditation or government approval",
              "Individual credentials",
              "Teaching quality",
            ]}
          />
        </div>
      </div>
    </Page>
  );
}
