import { useState } from "react";
import { useAccount, api } from "../components/Account.jsx";
import { Icon, useNotify } from "../components/Experience.jsx";
import { Page, ErrorText, Tag } from "../components/UI.jsx";
const roles = {
  holder: ["Credential holder", "Profile, qualifications and opportunities"],
  institution: ["Institution admin", "Issuance, requests and Trust Seal"],
  reviewer: ["Reviewer", "Assigned cases and evidence"],
  regulator: ["Regulator", "Oversight and confirmation records"],
};
export default function SignIn({ onOpen }) {
  const account = useAccount(),
    notify = useNotify();
  const [requested, setRequested] = useState("institution"),
    [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState(null);
  async function request(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/access/request", { role: requested, note });
      setNote("");
      await account.reload();
      notify("Access request submitted.");
      setMessage("");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadRequests() {
    try {
      setRequests((await api("/api/admin/access")).requests);
    } catch (e) {
      setMessage(e.message);
    }
  }
  async function decide(id, status) {
    try {
      await api("/api/admin/access", { id, status, scope: "Nigeria" });
      await loadRequests();
      notify(`Access ${status.toLowerCase()}.`);
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <Page title={account.user ? "Your workspaces" : "Workspace"}>
      <ErrorText>{message || account.error}</ErrorText>
      {account.loading ? (
        <div className="card mt" role="status">
          Checking account…
        </div>
      ) : !account.user ? (
        <div className="card signin-card mt">
          <Icon name="shield" size={32} />
          <h3>Sign in securely</h3>
          <p className="note">
            Workspaces are assigned to your account. Choosing a role does not
            grant access.
          </p>
          <a
            className="button-link btn-primary mt"
            href="/signin-with-chatgpt?return_to=%2F%23signin"
            target="_top"
          >
            Continue with ChatGPT
          </a>
        </div>
      ) : (
        <>
          <div className="account-line">
            <span>{account.user.name}</span>
            <span className="small-muted">{account.user.email}</span>
            <a
              className="text-link"
              href="/signout-with-chatgpt?return_to=%2F%23signin"
              target="_top"
            >
              Sign out
            </a>
          </div>
          <div className="workspace-grid">
            {account.roles.map(({ role, scope }) => (
              <button
                className="card workspace-choice"
                key={role}
                onClick={() => onOpen(role)}
              >
                <Icon name={role === "reviewer" ? "review" : role} size={28} />
                <span>
                  <strong>{roles[role][0]}</strong>
                  <small>{roles[role][1]}</small>
                </span>
                <Tag tone="ok">Assigned</Tag>
              </button>
            ))}
          </div>
          <div className="cols">
            <div className="card">
              <h3>Request another role</h3>
              <form className="form single" onSubmit={request}>
                <label className="fld">
                  Role
                  <select
                    value={requested}
                    onChange={(e) => setRequested(e.target.value)}
                  >
                    {Object.entries(roles)
                      .filter(
                        ([key]) =>
                          key !== "holder" &&
                          !account.roles.some((item) => item.role === key),
                      )
                      .map(([key, [label]]) => (
                        <option value={key} key={key}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="fld">
                  Organisation and access reason
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                  />
                </label>
                <button
                  className="btn-primary"
                  disabled={busy || account.roles.length === 4}
                >
                  {busy ? "Submitting…" : "Request access"}
                </button>
              </form>
              {account.requests?.map((item) => (
                <div className="ref" key={item.id}>
                  <div className="top">
                    <span>{roles[item.data.role][0]}</span>
                    <Tag tone="neutral">{item.data.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3>Account access</h3>
              <ul className="tick y">
                {[
                  "Authenticated identity",
                  "Server-enforced roles",
                  "Scoped records and audit history",
                ].map((text) => (
                  <li key={text}>
                    <Icon name="check" className="check-list-icon" size={18} />
                    {text}
                  </li>
                ))}
              </ul>
              {account.isAdmin && (
                <>
                  <button className="ghost mt" onClick={loadRequests}>
                    Manage access requests
                  </button>
                  {requests?.length === 0 && (
                    <p className="note">No requests.</p>
                  )}
                  {requests
                    ?.filter((r) => r.data.status === "Pending")
                    .map((row) => (
                      <div className="ref" key={row.id}>
                        <strong>{row.data.email}</strong>
                        <p>
                          {roles[row.data.role][0]} · {row.data.note}
                        </p>
                        <div className="actions">
                          <button
                            className="ghost"
                            onClick={() => decide(row.id, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="ghost"
                            onClick={() => decide(row.id, "Declined")}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
