import { useState } from "react";
import { useNotify } from "../components/Experience.jsx";
import { CATS, GL, GN, PR } from "../data.js";
import { Audit, Banner, Page } from "../components/UI.jsx";
import { assess, now } from "../lib/assessment.js";
export default function Review() {
  const notify = useNotify();
  const [application, setApplication] = useState(0),
    [scores, setScores] = useState(PR[0].v),
    [gates, setGates] = useState(PR[0].g.map(Boolean));
  const [audit, setAudit] = useState([
    ["Second reviewer assigned to Northgate Training Services", now()],
    ["Evidence checklist opened for ABC Technical Learning Centre", now()],
  ]);
  const result = assess(scores, gates);
  function load(i) {
    setApplication(i);
    setScores([...PR[i].v]);
    setGates(PR[i].g.map(Boolean));
  }
  function log(text) {
    notify(
      text.startsWith("Decision")
        ? "Decision recorded."
        : "Second review requested.",
    );
    setAudit((items) => [[text, `${now()} by You`], ...items]);
  }
  return (
    <Page title="Review">
      <div className="samples" role="group" aria-label="Applications">
        Application:
        {PR.map((item, i) => (
          <button
            key={item.n}
            className="chip"
            aria-pressed={application === i}
            onClick={() => load(i)}
          >
            {item.n}
          </button>
        ))}
      </div>
      <div className="cols">
        <div>
          <div className="card mb-sm">
            <h3>Rubric scores</h3>
            {CATS.map(([label, max], i) => (
              <div className="sl" key={label}>
                <div>
                  <label htmlFor={`score-${i}`}>{label}</label>
                  <output htmlFor={`score-${i}`}>
                    {scores[i]}/{max}
                  </output>
                </div>
                <input
                  type="range"
                  id={`score-${i}`}
                  min="0"
                  max={max}
                  value={scores[i]}
                  onChange={(event) =>
                    setScores(
                      scores.map((value, j) =>
                        i === j ? Number(event.target.value) : value,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Mandatory gates</h3>
            {GL.map((label, i) => (
              <label className="gate" key={label}>
                <input
                  type="checkbox"
                  checked={gates[i]}
                  onChange={(event) =>
                    setGates(
                      gates.map((value, j) =>
                        i === j ? event.target.checked : value,
                      ),
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <aside className="card out" aria-live="polite">
            <Banner
              tone={
                result.blocked
                  ? "bad"
                  : result.grade >= 2
                    ? "ok"
                    : result.grade === 1
                      ? "warn"
                      : "neutral"
              }
              icon={result.blocked ? "×" : result.grade}
              title={
                result.blocked
                  ? "Decision blocked"
                  : `Grade ${result.grade}: ${GN[result.grade]}`
              }
            />
            <p className="total">
              {result.total}
              <span> / 100</span>
            </p>
            <ul className="why">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="actions">
              <button
                className="btn-primary"
                disabled={result.blocked}
                onClick={() =>
                  log(
                    `Decision recorded for ${PR[application].n}: Grade ${result.grade}`,
                  )
                }
              >
                Record decision
              </button>
              <button
                className="ghost"
                onClick={() =>
                  log(`Escalated for second review: ${PR[application].n}`)
                }
              >
                Request second review
              </button>
            </div>
          </aside>
          <div className="card mt">
            <h3>Audit trail</h3>
            <Audit items={audit} />
          </div>
        </div>
      </div>
    </Page>
  );
}
