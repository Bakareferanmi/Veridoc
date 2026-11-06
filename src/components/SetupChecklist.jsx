import { useState } from "react";
import { setupSteps } from "../lib/onboarding.js";
import { Icon } from "./Experience.jsx";
import { useMutation } from "./WorkspaceUI.jsx";
import { Tag } from "./UI.jsx";

export default function SetupChecklist({ role, data, reload, onAction }) {
  const steps = setupSteps(role, data);
  const completed = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  const [reviewing, setReviewing] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const mutation = useMutation(reload);
  async function acknowledge(event) {
    event.preventDefault();
    if (!confirmed) return;
    if (
      await mutation.run(
        "/api/onboarding",
        { role, step: reviewing },
        "Setup updated.",
      )
    ) {
      setReviewing("");
      setConfirmed(false);
    }
  }
  return (
    <section className="card setup-card" aria-label="Workspace setup">
      <div className="section-heading">
        <h2>{next ? "Get started" : "Setup complete"}</h2>
        <Tag tone={next ? "neutral" : "ok"}>
          {completed} of {steps.length}
        </Tag>
      </div>
      <progress
        value={completed}
        max={steps.length}
        aria-label="Setup progress"
      />
      <ol className="setup-steps">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={step.done ? "is-done" : ""}
            aria-current={next?.id === step.id ? "step" : undefined}
          >
            <span className="setup-number">
              {step.done ? <Icon name="check" size={16} /> : index + 1}
            </span>
            <span>
              {step.label}
              {step.done && <span className="sr-only">, complete</span>}
            </span>
          </li>
        ))}
      </ol>
      {next && !reviewing && (
        <div className="setup-next">
          {next.note && <p className="note">{next.note}</p>}
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              if (["policy", "scope"].includes(next.id)) {
                setConfirmed(false);
                setReviewing(next.id);
              } else onAction(next.id);
            }}
          >
            {next.action}
          </button>
        </div>
      )}
      {reviewing && (
        <form className="setup-confirm" onSubmit={acknowledge}>
          {reviewing === "policy" ? (
            <>
              <p>
                Check source evidence, stay within the claim’s scope and avoid
                conflicts of interest.
              </p>
              <a className="text-link" href="#framework">
                Read assessment framework
              </a>
            </>
          ) : (
            <p>
              Assigned jurisdiction:{" "}
              <strong>
                {data.scope === "*" ? "All assigned jurisdictions" : data.scope}
              </strong>
              . Contact an administrator if this is incorrect.
            </p>
          )}
          <label className="gate">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              {reviewing === "policy"
                ? "I’ve reviewed the framework and review rules."
                : "This matches my authorised scope."}
            </span>
          </label>
          {mutation.feedback}
          <div className="actions">
            <button
              className="btn-primary"
              disabled={!confirmed || mutation.busy}
            >
              {mutation.busy ? "Saving…" : "Confirm reviewed"}
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => setReviewing("")}
              disabled={mutation.busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
