import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, ThemeToggle, useNotify } from "./components/Experience.jsx";
import Verify from "./pages/Verify.jsx";
import Institution from "./pages/Institution.jsx";
import Review from "./pages/Review.jsx";
import Seal from "./pages/Seal.jsx";
import References from "./pages/References.jsx";
import Appeals from "./pages/Appeals.jsx";
import Holder from "./pages/Holder.jsx";
import SignIn from "./pages/SignIn.jsx";
import Regulator from "./pages/Regulator.jsx";
import { Banner, Details, Page } from "./components/UI.jsx";
const links = [
  ["verify", "Verify"],
  ["institution", "Institution"],
  ["review", "Reviewer"],
  ["seal", "Seal page"],
  ["references", "References"],
  ["appeals", "Appeals"],
  ["holder", "My credentials"],
  ["regulator", "Regulator"],
  ["signin", "Workspace"],
];
const permissions = {
  public: ["verify", "seal", "signin"],
  holder: ["verify", "holder", "appeals", "seal", "signin"],
  institution: [
    "verify",
    "institution",
    "references",
    "appeals",
    "seal",
    "signin",
  ],
  reviewer: ["verify", "review", "references", "appeals", "seal", "signin"],
  regulator: ["verify", "regulator", "seal", "signin"],
};
const home = (role) =>
  role === "reviewer" ? "review" : role === "public" ? "signin" : role;
function readHash() {
  return window.location.hash.slice(1) || "verify";
}
export default function App() {
  const notify = useNotify();
  const pending = useRef(null);
  const previousPage = useRef(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [role, setRole] = useState("public"),
    [route, setRoute] = useState(readHash),
    [message, setMessage] = useState(""),
    [shares, setShares] = useState([]),
    [initialReference, setInitialReference] = useState(null);
  const navigate = useCallback(
    (destination) => {
      const page = destination.split("?")[0];
      if (
        role === "public" &&
        !permissions.public.includes(page) &&
        !page.startsWith("share/")
      )
        pending.current = destination;
      if (!page.startsWith("share/") && !permissions[role].includes(page)) {
        setMessage(
          role === "public"
            ? "Choose a workspace to continue."
            : "Unavailable for this role.",
        );
        window.location.hash = home(role);
        setRoute(home(role));
        return;
      }
      window.location.hash = destination;
      setRoute(destination);
    },
    [role],
  );
  useEffect(() => {
    const handler = () => setRoute(readHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const requestedPage = route.split("?")[0];
  const page =
    permissions[role].includes(requestedPage) ||
    requestedPage.startsWith("share/")
      ? requestedPage
      : home(role);
  useEffect(() => {
    const valid =
      links.some(([key]) => key === requestedPage) ||
      requestedPage.startsWith("share/");
    if (!valid) {
      navigate("verify");
      return;
    }
    if (
      !requestedPage.startsWith("share/") &&
      !permissions[role].includes(requestedPage)
    ) {
      navigate(requestedPage);
      return;
    }
    if (page === "verify") {
      const params = new URLSearchParams(route.split("?")[1] || "");
      setInitialReference(params.get("ref"));
    }
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (previousPage.current && previousPage.current !== page) {
      const heading = document.querySelector(
        "main > div:not([hidden]) h1, main > .page h1",
      );
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    previousPage.current = page;
  }, [route, page, requestedPage, role, navigate]);
  function signIn(next) {
    setRole(next);
    setMessage("");
    const destination =
      pending.current &&
      permissions[next].includes(pending.current.split("?")[0])
        ? pending.current
        : home(next);
    pending.current = null;
    window.location.hash = destination;
    setRoute(destination);
    notify("Workspace ready.");
  }
  function signOut() {
    setRole("public");
    setMessage("");
    setShares([]);
    pending.current = null;
    notify("Signed out.", "info");
    window.location.hash = "signin";
    setRoute("signin");
  }
  function navigation(mobile = false) {
    const items = links.filter(([key]) => permissions[role].includes(key));
    const hasOverflow = mobile && items.length > 4;
    const ordered = hasOverflow
      ? [
          ...new Set([
            "verify",
            home(role),
            "references",
            ...items.map(([key]) => key),
          ]),
        ]
          .map((key) => items.find(([itemKey]) => itemKey === key))
          .filter(Boolean)
      : items;
    const displayed = hasOverflow ? ordered.slice(0, 3) : ordered;
    const renderLink = ([key, label]) => (
      <a
        href={`#${key}`}
        key={key}
        aria-current={page === key ? "page" : undefined}
        className={key === "signin" ? "cta auth" : undefined}
        onClick={() => setMobileMenu(false)}
      >
        <Icon
          name={key === "verify" ? "search" : key === "signin" ? "user" : key}
          size={18}
        />
        <span>
          {key === "signin"
            ? role === "public"
              ? "Workspace"
              : "Account"
            : label}
        </span>
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
          {displayed.map(renderLink)}
          {hasOverflow && (
            <button
              type="button"
              className={`more-nav ${ordered.slice(3).some(([key]) => key === page) ? "is-current" : ""}`}
              aria-label="More pages"
              aria-expanded={mobileMenu}
              aria-controls="more-pages"
              onClick={() => setMobileMenu((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setMobileMenu(false);
              }}
            >
              <Icon name="more" />
              <span>More</span>
            </button>
          )}
          {hasOverflow && mobileMenu && (
            <div
              className="mobile-more-panel"
              id="more-pages"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMobileMenu(false);
                  document.querySelector('[aria-label="More pages"]')?.focus();
                }
              }}
            >
              <p>Your workspace</p>
              {ordered.slice(3).map(renderLink)}
            </div>
          )}
        </nav>
      </>
    );
  }
  const shared = page.startsWith("share/")
    ? shares.find((item) => item.token === page.slice(6))
    : null;
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Skip to content
      </a>
      <div className="wrap">
        <header className="site-header">
          <a className="brand" href="#verify" aria-label="VERIDOC home">
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
        <main id="main-content" tabIndex="-1">
          <div className="view-screen" hidden={page !== "verify"}>
            <Verify
              navigate={navigate}
              initialReference={initialReference}
              active={page === "verify"}
            />
          </div>
          <div className="view-screen" hidden={page !== "institution"}>
            <Institution key={`institution-${role}`} />
          </div>
          <div className="view-screen" hidden={page !== "review"}>
            <Review key={`review-${role}`} />
          </div>
          <div className="view-screen" hidden={page !== "seal"}>
            <Seal />
          </div>
          <div className="view-screen" hidden={page !== "references"}>
            <References key={`references-${role}`} />
          </div>
          <div className="view-screen" hidden={page !== "appeals"}>
            <Appeals key={`appeals-${role}`} />
          </div>
          <div className="view-screen" hidden={page !== "holder"}>
            <Holder
              key={`holder-${role}`}
              shares={shares}
              setShares={setShares}
            />
          </div>
          <div className="view-screen" hidden={page !== "signin"}>
            <SignIn
              role={role}
              onSignIn={signIn}
              onSignOut={signOut}
              navigate={navigate}
              message={message}
            />
          </div>
          <div className="view-screen" hidden={page !== "regulator"}>
            <Regulator key={`regulator-${role}`} />
          </div>
          {page.startsWith("share/") && (
            <Page title="Shared credential">
              {shared &&
              shared.s === "Active" &&
              shared.expires > Date.now() ? (
                <div className="card mt">
                  <p className="note">
                    {shared.to} · {shared.p}
                  </p>
                  <Details rows={shared.rows} />
                </div>
              ) : (
                <div className="card mt">
                  <Banner tone="neutral" icon="–" title="Link unavailable">
                    Expired, revoked or outside this session.
                  </Banner>
                </div>
              )}
            </Page>
          )}
        </main>
        <footer>VERIDOC · Sample data. Not accreditation.</footer>
      </div>
      {navigation(true)}
    </>
  );
}
