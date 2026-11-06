import { useState } from "react";
import { api, useAccount } from "./Account.jsx";
import { ErrorText, Field } from "./UI.jsx";
import { Icon } from "./Experience.jsx";

export default function StandaloneSignIn() {
  const account = useAccount();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (creating && password !== confirm)
      return setError("Passwords do not match.");
    setBusy(true);
    try {
      await api(`/api/auth/${creating ? "sign-up" : "sign-in"}/email`, {
        email: email.trim(),
        password,
        ...(creating ? { name: name.trim() } : {}),
      });
      setPassword("");
      setConfirm("");
      await account.reload();
    } catch (e) {
      setError(
        creating
          ? e.message
          : "Unable to sign in. Check your email and password, or try again shortly.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card signin-card mt">
      <Icon name="shield" size={32} />
      <h3>{creating ? "Create account" : "Sign in"}</h3>
      <form className="form single auth-form" onSubmit={submit}>
        <ErrorText>{error}</ErrorText>
        {creating && (
          <Field label="Name">
            <input
              type="text"
              required
              autoComplete="name"
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={creating ? 12 : undefined}
            maxLength={128}
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {creating && (
          <Field label="Confirm password">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
        )}
        <label className="gate">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
          />
          <span>Show password</span>
        </label>
        {creating && (
          <p className="note">
            Use at least 12 characters. New accounts start with holder access.
          </p>
        )}
        <button
          className="btn-primary"
          disabled={busy || (creating && !name.trim())}
        >
          {busy ? "Please wait…" : creating ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => {
            setCreating(!creating);
            setError("");
            setPassword("");
            setConfirm("");
          }}
        >
          {creating ? "Already registered? Sign in" : "Create an account"}
        </button>
      </form>
    </div>
  );
}
