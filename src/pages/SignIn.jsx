import { useState } from "react";
import { RL } from "../data.js";
import { Icon } from "../components/Experience.jsx";
import { ErrorText, Field } from "../components/UI.jsx";
export default function SignIn({
  role,
  onSignIn,
  onSignOut,
  navigate,
  message,
}) {
  const [selected, setSelected] = useState("holder"),
    [email, setEmail] = useState("demo@example.com"),
    [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Enter a valid email.");
    setError("");
    onSignIn(selected);
  }
  return (
    <div className="page signin-page">
      <h1>{role === "public" ? "Workspace" : "Account"}</h1>

      <ErrorText>{error || message}</ErrorText>
      {role === "public" ? (
        <div className="card mt">
          <h3>Role</h3>
          <form onSubmit={submit} noValidate>
            <div className="mb-sm">
              {RL.map(([value, label]) => (
                <label
                  className={`gate role-choice ${selected === value ? "is-selected" : ""}`}
                  key={value}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={selected === value}
                    onChange={() => setSelected(value)}
                  />
                  <span className="role-icon">
                    <Icon name={value === "reviewer" ? "review" : value} />
                  </span>
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="form single">
              <Field label="Demo email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </Field>
              <button className="btn-primary">Open workspace</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card mt">
          <h3>{RL.find((item) => item[0] === role)?.[1]}</h3>

          <div className="actions">
            <button
              className="btn-primary"
              onClick={() => navigate(role === "reviewer" ? "review" : role)}
            >
              Open workspace
            </button>
            <button className="ghost" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
