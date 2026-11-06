import { useEffect, useState } from "react";
import {
  useWorkspace,
  useAccount,
  AccessState,
} from "../components/Account.jsx";
import { Banner, Page, Stats, Tag } from "../components/UI.jsx";
import { Empty, useMutation } from "../components/WorkspaceUI.jsx";
import { FRAMEWORKS, EVIDENCE_GATES } from "../lib/frameworks.js";
import { assess } from "../lib/assessment.js";
export default function Review() {
  const workspace = useWorkspace("reviewer"),
    account = useAccount(),
    mutation = useMutation(workspace.reload);
  const [selected, setSelected] = useState(""),
    [scores, setScores] = useState([0, 0, 0, 0, 0, 0]),
    [gates, setGates] = useState([false, false, false, false, false]),
    [verified, setVerified] = useState([]);
  const current =
    workspace.data?.cases.find((c) => c.id === selected) ||
    workspace.data?.cases[0];
  useEffect(() => {
    if (current) {
      setScores(current.data.scores);
      setGates(current.data.gates);
      setVerified(
        current.data.evidence.flatMap((e, i) => (e.verified ? [i] : [])),
      );
    }
  }, [current?.id, current?.updated_at]);
  if (workspace.loading || workspace.error)
    return (
      <Page title="Reviewer">
        <AccessState {...workspace} />
      </Page>
    );
  const d = workspace.data;
  const result = current ? assess(scores, gates) : null;
  async function save(escalate = false) {
    await mutation.run(
      current.data.secondReviewerId === account.user.id
        ? "/api/reviewer/second-decision"
        : "/api/reviewer/decision",
      { id: current.id, scores, gates, verifiedEvidence: verified, escalate },
      escalate ? "Second review requested." : "Decision saved.",
    );
  }
  return (
    <Page title="Reviewer">
      <Stats
        items={[
          [d.cases.length, "Assigned cases"],
          [d.queue.length, "Unassigned"],
          [
            d.cases.filter((c) => c.data.status === "Second review required")
              .length,
            "Second reviews",
          ],
        ]}
      />
      {mutation.feedback}
      <div className="review-queue">
        <div className="card">
          <h3>Your cases</h3>
          {d.cases.length ? (
            <div className="case-list">
              {d.cases.map((row) => (
                <button
                  className={`case-choice ${current?.id === row.id ? "selected" : ""}`}
                  key={row.id}
                  onClick={() => setSelected(row.id)}
                >
                  <strong>{row.data.subject}</strong>
                  <span>
                    {FRAMEWORKS[row.data.kind].singular} · {row.data.status}
                  </span>
                  {row.data.example && <Tag tone="neutral">Example</Tag>}
                </button>
              ))}
            </div>
          ) : (
            <Empty title="No assigned cases" />
          )}
          {d.secondQueue?.map((row) => (
            <div className="ref" key={row.id}>
              <h4>{row.subject}</h4>
              <p>Independent second review</p>
              <button
                className="ghost"
                disabled={mutation.busy}
                onClick={() =>
                  mutation.run(
                    "/api/reviewer/claim-second",
                    { id: row.id },
                    "Second review assigned.",
                  )
                }
              >
                Assign second review
              </button>
            </div>
          ))}
          {d.queue.map((row) => (
            <div className="ref" key={row.id}>
              <h4>{row.subject}</h4>
              <p>{FRAMEWORKS[row.kind].singular}</p>
              <button
                className="ghost"
                disabled={mutation.busy}
                onClick={() =>
                  mutation.run(
                    "/api/reviewer/claim",
                    { id: row.id },
                    "Case assigned.",
                  )
                }
              >
                Assign to me
              </button>
            </div>
          ))}
          {account.isAdmin && (
            <button
              className="ghost mt"
              disabled={mutation.busy}
              onClick={() =>
                mutation.run("/api/reviewer/example", {}, "Example case ready.")
              }
            >
              Open example case
            </button>
          )}
          <p className="note">
            Own submissions and institutions cannot be self-reviewed.
          </p>
        </div>
        <div>
          {current && (
            <>
              <div className="case-heading">
                <h3>{current.data.subject}</h3>
                <Tag tone={current.data.example ? "neutral" : "ok"}>
                  {current.data.example ? "Example case" : "Assigned to you"}
                </Tag>
              </div>
              <div className="scope-strip">
                <p>
                  {current.data.scope} · {current.data.jurisdiction}
                </p>
              </div>
              <div className="card mb-sm">
                <h3>Submitted evidence</h3>
                {current.data.evidence.map((item, i) => (
                  <label className="gate evidence-check" key={i}>
                    <input
                      type="checkbox"
                      checked={verified.includes(i)}
                      onChange={(e) =>
                        setVerified(
                          e.target.checked
                            ? [...verified, i]
                            : verified.filter((v) => v !== i),
                        )
                      }
                    />
                    <span>
                      {item.title}
                      <small>
                        {
                          FRAMEWORKS[current.data.kind].categories[
                            item.category
                          ][0]
                        }{" "}
                        · {item.reference}
                      </small>
                      <small>
                        {verified.includes(i)
                          ? "Source checked by reviewer"
                          : "Confirm after checking the source"}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="cols review-score-grid">
                <div className="card">
                  <h3>{FRAMEWORKS[current.data.kind].singular} assessment</h3>
                  {FRAMEWORKS[current.data.kind].categories.map(
                    ([label, max], i) => (
                      <div className="sl" key={label}>
                        <div>
                          <label htmlFor={`score-${i}`}>{label}</label>
                          <output>
                            {scores[i]}/{max}
                          </output>
                        </div>
                        <input
                          id={`score-${i}`}
                          type="range"
                          min="0"
                          max={max}
                          value={scores[i]}
                          onChange={(e) =>
                            setScores(
                              scores.map((v, j) =>
                                i === j ? Number(e.target.value) : v,
                              ),
                            )
                          }
                        />
                      </div>
                    ),
                  )}
                  <h3>Mandatory gates</h3>
                  {EVIDENCE_GATES.map((label, i) => (
                    <label className="gate" key={label}>
                      <input
                        type="checkbox"
                        checked={gates[i]}
                        onChange={(e) =>
                          setGates(
                            gates.map((v, j) =>
                              i === j ? e.target.checked : v,
                            ),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <aside className="card out">
                  <Banner
                    title={
                      result.blocked
                        ? "Decision blocked"
                        : `Grade ${result.grade}: ${FRAMEWORKS[current.data.kind].grades[result.grade]}`
                    }
                    tone={
                      result.blocked ? "bad" : result.grade >= 2 ? "ok" : "warn"
                    }
                    icon={result.blocked ? "×" : result.grade}
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
                  <p className="note">
                    Every scored category requires verified source evidence.
                    Grade 3 stays pending a different reviewer.
                  </p>
                  <div className="actions">
                    <button
                      className="btn-primary"
                      disabled={
                        mutation.busy ||
                        result.blocked ||
                        current.data.status === "Decision recorded"
                      }
                      onClick={() => save()}
                    >
                      {current.data.secondReviewerId === account.user.id
                        ? "Confirm second review"
                        : "Record decision"}
                    </button>
                    <button
                      className="ghost"
                      disabled={mutation.busy}
                      onClick={() => save(true)}
                    >
                      Request second review
                    </button>
                  </div>
                  <a className="text-link block-link" href="#framework">
                    Published criteria
                  </a>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="card mb">
        <h3>Assessment history</h3>
        {d.audit.length ? (
          <ul className="axis">
            {d.audit.map((row, i) => (
              <li key={i}>
                <div>
                  {row.action}
                  <small>{row.target_id}</small>
                </div>
                <span className="small-muted">
                  {new Date(row.created_at).toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No review actions yet" />
        )}
      </div>
    </Page>
  );
}
