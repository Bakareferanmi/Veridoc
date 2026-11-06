import { useState } from "react";
import {
  FRAMEWORKS,
  GRADE_RULES,
  FRAMEWORK_VERSION,
  EVIDENCE_GATES,
} from "../lib/frameworks.js";
import { Page, Tag } from "../components/UI.jsx";
import { Icon } from "../components/Experience.jsx";
export default function Framework() {
  const [kind, setKind] = useState("institution"),
    framework = FRAMEWORKS[kind];
  return (
    <Page title="Assessment framework">
      <div className="section-heading">
        <span className="mono small-muted">Version {FRAMEWORK_VERSION}</span>
        <Tag tone="neutral">Evidence only</Tag>
      </div>
      <div
        className="samples framework-switch"
        role="group"
        aria-label="Assessment subject"
      >
        {Object.entries(FRAMEWORKS).map(([id, item]) => (
          <button
            className="chip"
            key={id}
            aria-pressed={kind === id}
            onClick={() => setKind(id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="scope-strip">
        <Icon name="shield" />
        <p>{framework.scope}</p>
      </div>
      <div className="grade-grid">
        {GRADE_RULES.map((item) => (
          <article className="card grade-card" key={item.grade}>
            <span className="grade-number">{item.grade}</span>
            <h3>{framework.grades[item.grade]}</h3>
            <p>{item.criteria}</p>
          </article>
        ))}
      </div>
      <div className="cols">
        <div className="card">
          <h3>Published criteria</h3>
          <ul className="axis">
            {framework.categories.map(([name, max, detail]) => (
              <li key={name}>
                <div>
                  {name}
                  <small>{detail}</small>
                </div>
                <Tag tone="neutral">{max} pts</Tag>
              </li>
            ))}
          </ul>
          <p className="note">
            Scores require verified source evidence. Grade 3 requires a second
            reviewer.
          </p>
        </div>
        <div>
          <div className="card mb-sm">
            <h3>Mandatory gates</h3>
            <ul className="tick y">
              {EVIDENCE_GATES.map((text) => (
                <li key={text}>
                  <Icon name="check" className="check-list-icon" size={18} />
                  {text}
                </li>
              ))}
            </ul>
            <p className="note">
              Failed identity, integrity, accountability or security gates block
              grading. Unconfirmed authority caps the grade at 1.
            </p>
          </div>
          <div className="card independence-card">
            <Icon name="review" />
            <h3>Payment never buys a grade.</h3>
            <p>
              Plans can add visibility, analytics or services. Criteria,
              evidence thresholds and review decisions stay the same.
            </p>
            <a className="text-link" href="#appeals">
              Challenge an assessment
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
}
