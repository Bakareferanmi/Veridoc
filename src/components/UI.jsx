import { Fragment, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "./Experience.jsx";
import { EXAMPLE_SEAL } from "../lib/frameworks.js";
export function Banner({ tone = "ok", icon = "✓", title, children }) {
  const statusIcon = {
    "✓": "check",
    "×": "close",
    "!": "alert",
    "?": "help",
    "–": "minus",
    "≠": "mismatch",
  }[icon];
  return (
    <div className={`banner s-${tone}`}>
      <div className="ic" aria-hidden="true">
        {statusIcon ? (
          <Icon
            name={statusIcon}
            className={statusIcon === "check" ? "status-check" : undefined}
          />
        ) : (
          icon
        )}
      </div>
      <div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
export function Details({ rows, ...props }) {
  return (
    <dl {...props}>
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd className={label === "Reference" ? "mono" : undefined}>
            {value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
export function Tag({ tone = "ok", children }) {
  return <span className={`tag s-${tone}`}>{children}</span>;
}
export function Page({ title, children }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="stats">
      {items.map(([value, label]) => (
        <div className="stat" key={label}>
          <b key={String(value)} className="stat-value">
            {value}
          </b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
export function Field({ label, children }) {
  return (
    <label className="fld">
      {label}
      {children}
    </label>
  );
}
export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="err field-error" role="alert">
      <Icon name="info" size={18} />
      <span>{children}</span>
    </p>
  );
}
export function Audit({ items }) {
  return (
    <ul className="axis audit">
      {items.map(([text, time], i) => (
        <li key={`${time}-${i}`}>
          <div>
            {text}
            <small>{time}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function Checks({ items, positive = true }) {
  return (
    <ul className={`tick ${positive ? "y" : "n"}`}>
      {items.map((item) => (
        <li key={item}>
          <Icon
            name={positive ? "check" : "close"}
            className="check-list-icon"
            size={18}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
export function QR({ value }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: 300,
      margin: 1,
      color: { dark: "#14213D", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setUrl(url);
      })
      .catch(() => {
        if (active) setUrl("");
      });
    return () => {
      active = false;
    };
  }, [value]);
  return (
    <div className="qr">
      {url ? (
        <img
          src={url}
          alt="QR code linking to this verification page"
          width="300"
          height="300"
        />
      ) : (
        <span>Generating QR code…</span>
      )}
    </div>
  );
}
export function Rosette({ grade = 2, verified = true }) {
  return (
    <svg className="rosette" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke={verified ? "var(--ok)" : "var(--line)"}>
        <circle cx="60" cy="60" r="56" strokeWidth="2" strokeDasharray="3 4" />
        <circle cx="60" cy="60" r="46" strokeWidth="3" />
        <circle cx="60" cy="60" r="38" strokeWidth="1" />
      </g>
      <path
        d={verified ? "M42 62l12 12 24-26" : "M48 60h24"}
        fill="none"
        stroke={verified ? "var(--ok)" : "var(--muted)"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="96"
        textAnchor="middle"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="9"
        fill="var(--ok)"
      >
        {grade === null ? "PENDING" : `GRADE ${grade}`}
      </text>
    </svg>
  );
}
export function InstitutionSeal() {
  return (
    <aside className="card seal">
      <Rosette />
      <h3>ABC Technical Learning Centre</h3>
      <div className="id">VDC-NG-000123</div>
      <Details
        rows={[
          ["Seal", "Grade 2"],
          ["Scope", "Short-course certificates"],
          ["Identity", "Verified"],
          ["Accreditation", "Not claimed"],

          ["Status", "Active"],
          ["Next review", "12 Mar 2027"],
        ]}
      />
      <a className="text-link block-link" href={`#seal/${EXAMPLE_SEAL.id}`}>
        Open verification record
      </a>
      <details className="disclosure">
        <summary>Evidence</summary>
        <p>
          Registration, site review, independent reference and issuer records.
        </p>
        <p>Credentials are checked separately.</p>
      </details>
    </aside>
  );
}
