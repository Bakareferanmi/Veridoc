import { useState } from "react";
import { Icon, useNotify } from "../components/Experience.jsx";
import { REG } from "../data.js";
import { Page, Stats, Tag, ErrorText } from "../components/UI.jsx";
import { today } from "../lib/assessment.js";
export default function Institution() {
  const notify = useNotify();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [records, setRecords] = useState(REG),
    [fields, setFields] = useState(["", "", ""]),
    [error, setError] = useState("");
  const filtered = records.filter(
    (record) =>
      (statusFilter === "All statuses" || record[4] === statusFilter) &&
      record.join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  function register(event) {
    event.preventDefault();
    const values = fields.map((field) => field.trim());
    if (values.some((value) => !value))
      return setError("Enter the reference, holder and credential.");
    if (
      records.some(
        (record) => record[0].toLowerCase() === values[0].toLowerCase(),
      )
    )
      return setError("Reference already registered.");
    setRecords([...records, [...values, today(), "Active"]]);
    setFields(["", "", ""]);
    setQuery("");
    setStatusFilter("All statuses");
    notify(`Credential ${values[0]} registered.`);
    setError("");
  }
  return (
    <Page title="ABC Technical Learning Centre">
      <Stats
        items={[
          ["Grade 2", "Issuing Authority Verified"],
          [records.length, "Credentials"],
          ["12 Mar 2028", "Next review"],
        ]}
      />
      <div className="cols">
        <div className="card">
          <h3>Assessment stages</h3>
          <ol className="steps">
            {[
              ["Application", "Details and intended credential categories"],
              ["Identity evidence", "Registration record and site review"],
              ["Authority assessment", "Short-course certificates, Nigeria"],
              ["Independent corroboration", "One reference confirmed"],
              [
                "Operational controls",
                "Add a second administrator and turn on MFA",
              ],
              [
                "Decision and publication",
                "Grade 3 reassessment after controls are in place",
              ],
            ].map(([title, detail], i) => (
              <li key={title}>
                <span
                  className={`dot ${i < 4 ? "done" : i === 4 ? "now" : ""}`}
                >
                  {i < 4 ? <Icon name="check" size={16} /> : i + 1}
                </span>
                <div>
                  {title}
                  <small>{detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h3>Evidence on file</h3>
          <ul className="axis">
            {[
              ["Registration record", "Uploaded 02 Feb 2026", "Verified", "ok"],
              ["Site review", "Completed 12 Feb 2026", "Verified", "ok"],
              [
                "Learner register sample",
                "Checked against 12 certificates",
                "In review",
                "warn",
              ],
              [
                "Administrator MFA",
                "1 of 2 administrators",
                "Incomplete",
                "neutral",
              ],
            ].map(([title, detail, status, tone]) => (
              <li key={title}>
                <div>
                  {title}
                  <small>{detail}</small>
                </div>
                <Tag tone={tone}>{status}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card mb">
        <div className="section-heading">
          <div>
            <h3>Credential register</h3>
            <p>
              {filtered.length} of {records.length} credentials
            </p>
          </div>
        </div>
        <div className="register-toolbar">
          <div className="filter-search">
            <Icon name="search" size={18} />
            <input
              type="search"
              aria-label="Search credential register"
              placeholder="Search credentials"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="Filter by credential status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {["All statuses", "Active", "Expired"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                {["Reference", "Holder", "Credential", "Issued", "Status"].map(
                  (label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record[0]}>
                  {record.map((value, i) => (
                    <td key={i} className={i === 0 ? "mono" : undefined}>
                      {i === 4 ? (
                        <Tag tone={value === "Active" ? "ok" : "warn"}>
                          {value}
                        </Tag>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <Icon name="search" size={28} />
                      <h4>No matches</h4>
                      <p>Try another search.</p>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("All statuses");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form className="add" onSubmit={register} noValidate>
          {["Reference", "Holder name", "Credential type"].map((label, i) => (
            <input
              type="text"
              key={label}
              aria-label={label}
              placeholder={label}
              value={fields[i]}
              onChange={(event) =>
                setFields(
                  fields.map((value, j) =>
                    i === j ? event.target.value : value,
                  ),
                )
              }
            />
          ))}
          <button className="btn-primary">Register</button>
        </form>
        <ErrorText>{error}</ErrorText>
      </div>
    </Page>
  );
}
