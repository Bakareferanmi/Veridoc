import { useEffect, useState } from "react";
import { Icon, ThemeToggle } from "./components/Experience.jsx";
import { useAccount, api } from "./components/Account.jsx";
import { Banner, Details, Page } from "./components/UI.jsx";
import Verify from "./screens/Verify.jsx";
import Seal from "./screens/Seal.jsx";
import Framework from "./screens/Framework.jsx";
import Holder from "./screens/Holder.jsx";
import Institution from "./screens/Institution.jsx";
import Review from "./screens/Review.jsx";
import Regulator from "./screens/Regulator.jsx";
import Appeals from "./screens/Appeals.jsx";
import SignIn from "./screens/SignIn.jsx";
const home = {
  holder: "holder",
  institution: "institution",
  reviewer: "review",
  regulator: "regulator",
};
const roleFor = {
  holder: "holder",
  opportunities: "holder",
  institution: "institution",
  review: "reviewer",
  regulator: "regulator",
  references: "institution",
};
const publicLinks = [
  ["verify", "Verify", "search"],
  ["seal", "Trust Seal", "seal"],
  ["framework", "Framework", "review"],
  ["signin", "Workspace", "user"],
];
const workspaceLinks = {
  holder: [
    ["holder", "My identity", "holder"],
    ["opportunities", "Opportunities", "opportunities"],
    ["appeals", "Appeals", "appeals"],
  ],
  institution: [
    ["institution", "Institution", "institution"],
    ["appeals", "Appeals", "appeals"],
  ],
  reviewer: [
    ["review", "Cases", "review"],
    ["appeals", "Appeals", "appeals"],
  ],
  regulator: [["regulator", "Oversight", "regulator"]],
};
const readHash = () => window.location.hash.slice(1) || "verify";
function SharedProof({ id }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api(`/api/public/shares/${encodeURIComponent(id)}`)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <Page title="Shared credential">
      <div className="card mt">
        {data ? (
          <>
            <Banner title={data.rows[0]?.[1] || "Shared proof"} />
            <Details rows={data.rows} />
            <p className="note">
              {data.purpose} · Expires{" "}
              {new Date(data.expiresAt).toLocaleString("en-GB")}
            </p>
          </>
        ) : error ? (
          <Banner tone="neutral" icon="–" title="Link unavailable">
            {error}
          </Banner>
        ) : (
          <p role="status">Loading proof…</p>
        )}
      </div>
    </Page>
  );
}
export default function App() {
  const account = useAccount();
  const [route, setRoute] = useState(readHash),
    [activeRole, setActiveRole] = useState("holder"),
    [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    const handler = () => setRoute(readHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const raw = route.split("?")[0],
    page = raw.split("/")[0],
    params = new URLSearchParams(route.split("?")[1] || ""),
    granted = account.roles.some(
      (item) => item.role === (roleFor[page] || activeRole),
    );
  useEffect(() => {
    setMobileMenu(false);
    if (
      roleFor[page] &&
      account.roles.some((item) => item.role === roleFor[page])
    )
      setActiveRole(roleFor[page]);
    window.scrollTo({ top: 0, behavior: "instant" });
    const heading = document.querySelector("main h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [route, account.roles]);
  function navigate(to) {
    window.location.hash = to;
    setRoute(to);
  }
  function open(role) {
    if (account.roles.some((item) => item.role === role)) {
      setActiveRole(role);
      navigate(home[role]);
    }
  }
  const needsAccess = roleFor[page] || page === "appeals";
  let content;
  if (needsAccess && (account.loading || !account.user || !granted))
    content = account.loading ? (
      <Page title="Workspace">
        <div className="card mt" role="status">
          Checking access…
        </div>
      </Page>
    ) : (
      <SignIn onOpen={open} />
    );
  else
    switch (page) {
      case "verify":
        content = (
          <Verify
            navigate={navigate}
            initialReference={params.get("ref")}
            active
          />
        );
        break;
      case "framework":
        content = <Framework />;
        break;
      case "seal":
        content = (
          <Seal
            reference={
              raw.split("/")[1]
                ? decodeURIComponent(raw.split("/")[1])
                : undefined
            }
          />
        );
        break;
      case "holder":
        content = <Holder />;
        break;
      case "opportunities":
        content = <Holder initialTab="opportunities" />;
        break;
      case "institution":
      case "references":
        content = <Institution />;
        break;
      case "review":
        content = <Review />;
        break;
      case "regulator":
        content = <Regulator />;
        break;
      case "appeals":
        content = <Appeals reference={params.get("reference") || ""} />;
        break;
      case "share":
        content = <SharedProof id={raw.split("/")[1] || ""} />;
        break;
      default:
        content = <SignIn onOpen={open} />;
    }
  const links = account.user
    ? [
        ["verify", "Verify", "search"],
        ...(workspaceLinks[activeRole] || workspaceLinks.holder),
        ["framework", "Framework", "review"],
        ["seal", "Trust Seal", "seal"],
        ["signin", "Account", "user"],
      ]
    : publicLinks;
  function navigation(mobile = false) {
    const hasOverflow = mobile && links.length > 4,
      shown = hasOverflow ? links.slice(0, 3) : links;
    const link = ([id, label, icon]) => (
      <a
        key={id}
        href={`#${id}`}
        aria-current={page === id ? "page" : undefined}
        className={id === "signin" ? "cta auth" : undefined}
        onClick={() => setMobileMenu(false)}
      >
        <Icon name={icon} size={18} />
        <span>{label}</span>
      </a>
    );
    return (
      <>
        {mobile && mobileMenu && (
          <button
            className="mobile-menu-backdrop"
            aria-label="Close more navigation"
            onClick={() => setMobileMenu(false)}
          />
        )}
        <nav
          className={mobile ? "tabbar" : undefined}
          aria-label={mobile ? "Mobile navigation" : "Main navigation"}
        >
          {shown.map(link)}
          {hasOverflow && (
            <button
              className="more-nav"
              aria-label="More pages"
              aria-expanded={mobileMenu}
              aria-controls="more-pages"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Icon name="more" />
              <span>More</span>
            </button>
          )}
          {hasOverflow && mobileMenu && (
            <div
              className="mobile-more-panel"
              id="more-pages"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setMobileMenu(false);
                  document.querySelector('[aria-label="More pages"]')?.focus();
                }
              }}
            >
              <p>Workspace</p>
              {links.slice(3).map(link)}
            </div>
          )}
        </nav>
      </>
    );
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Skip to content
      </a>
      <div className="wrap">
        <header className="site-header">
          <a className="brand" href="#verify" aria-label="VeriDoc home">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M16 2l11 4v9c0 7-4.6 12.4-11 15C9.6 27.4 5 22 5 15V6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <path
                d="M10.5 15.5l4 4 7-8"
                fill="none"
                stroke="var(--ok)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <div className="header-controls">
            {navigation()}
            <ThemeToggle />
          </div>
        </header>
        {account.user && account.roles.length > 1 && (
          <div className="workspace-switch">
            <span className="small-muted">Workspace</span>
            <select
              aria-label="Assigned workspace"
              value={activeRole}
              onChange={(e) => open(e.target.value)}
            >
              {account.roles.map((item) => (
                <option key={item.role} value={item.role}>
                  {
                    {
                      holder: "Credential holder",
                      institution: "Institution admin",
                      reviewer: "Reviewer",
                      regulator: "Regulator",
                    }[item.role]
                  }
                </option>
              ))}
            </select>
            <TagLine name={account.user.name} />
          </div>
        )}
        <main id="main-content" tabIndex="-1">
          <div className="view-screen" key={page}>
            {content}
          </div>
        </main>
        <footer>VeriDoc · Identity, credentials & opportunity</footer>
      </div>
      {navigation(true)}
    </>
  );
}
function TagLine({ name }) {
  return <span className="account-name">{name}</span>;
}
