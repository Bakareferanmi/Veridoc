import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Icon, useNotify } from "../components/Experience.jsx";
import { DATA } from "../data.js";
import {
  Banner,
  Details,
  ErrorText,
  InstitutionSeal,
  Tag,
} from "../components/UI.jsx";
import { now, referenceFromText } from "../lib/assessment.js";
const outcomes = [
  ["verified", "Verified"],
  ["expired", "Expired"],
  ["mismatch", "Mismatch"],
  ["notfound", "Not found"],
  ["unable", "Unable to verify"],
];
export default function Verify({ navigate, initialReference, active }) {
  const notify = useNotify();
  const [inputError, setInputError] = useState("");
  const [resultVersion, setResultVersion] = useState(0);
  const [resolvedReference, setResolvedReference] = useState("VDC-CR-48210");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const resultPanel = useRef(null),
    focusResult = useRef(false);
  const [method, setMethod] = useState("ref");
  const [reference, setReference] = useState("VDC-CR-48210");
  const [result, setResult] = useState("verified");
  const [checkedAt, setCheckedAt] = useState(now);
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const video = useRef(null),
    stream = useRef(null),
    fileInput = useRef(null),
    frame = useRef(0);
  const d = DATA[result];
  function verify(value = reference, moveToResult = false) {
    const normalized = referenceFromText(value) || value.trim().toUpperCase();
    if (!normalized) {
      setInputError("Enter a reference.");
      return;
    }
    if (!/^VDC-CR-\d{5,}$/.test(normalized)) {
      setInputError("Use VDC-CR-48210 or paste a QR link.");
      return;
    }
    const next =
      Object.keys(DATA).find((key) => DATA[key].ref === normalized) ||
      "notfound";
    focusResult.current = moveToResult;
    setReference(normalized);
    setResolvedReference(normalized);
    setResult(next);
    setResultVersion((version) => version + 1);
    setCheckedAt(now());
    setMessage("");
    setInputError("");
  }
  useEffect(() => {
    if (!focusResult.current) return;
    focusResult.current = false;
    const heading = resultPanel.current?.querySelector("h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    resultPanel.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [resultVersion]);
  useEffect(() => {
    if (initialReference) {
      setReference(initialReference);
      setResolvedReference(initialReference);
      setResultVersion((version) => version + 1);
      setResult(
        Object.keys(DATA).find((key) => DATA[key].ref === initialReference) ||
          "notfound",
      );
      setCheckedAt(now());
    }
  }, [initialReference]);
  useEffect(() => {
    if (!active) setScanning(false);
  }, [active]);
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const stop = () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      cancelAnimationFrame(frame.current);
    };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("Camera unavailable. Enter the reference.");
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = media;
        video.current.srcObject = media;
        await video.current.play();
        const canvas = document.createElement("canvas"),
          context = canvas.getContext("2d", { willReadFrequently: true });
        const scan = () => {
          if (cancelled || !video.current) return;
          if (video.current.readyState >= 2) {
            canvas.width = video.current.videoWidth;
            canvas.height = video.current.videoHeight;
            context.drawImage(video.current, 0, 0);
            const image = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const code = jsQR(image.data, image.width, image.height);
            if (code) {
              const ref = referenceFromText(code.data);
              if (ref) {
                verify(ref);
                setMethod("ref");
                setScanning(false);
                return;
              }
              setMessage("No credential reference in this QR.");
            }
          }
          frame.current = requestAnimationFrame(scan);
        };
        scan();
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error.name === "NotAllowedError"
              ? "Camera blocked. Enter the reference."
              : error.message,
          );
          setScanning(false);
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [scanning]);
  function changeMethod(next) {
    setMethod(next);
    setScanning(false);
    setMessage("");
  }
  async function selectFile(file) {
    if (!file) return;
    if (
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      setMessage("Choose a PDF, JPG, PNG or WebP file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Maximum file size: 10 MB.");
      return;
    }
    setSelectedFile(file);
    // A filename reference can prefill a demo lookup; file contents are never represented as verified.
    const ref = referenceFromText(file.name);
    if (ref) setReference(ref);
    setMessage(
      `${ref ? `Reference: ${ref}. ` : ""}Extraction unavailable. Enter the reference to continue.`,
    );
  }
  function download() {
    const content = [
      "VERIDOC — Sample verification report",
      "",
      d.title,
      d.msg,
      "",
      ...[
        ["Credential", d.cred],
        ["Holder", d.holder],
        ["Reference", result === "notfound" ? resolvedReference : d.ref],
        ["Issued", d.issued],
        ["Expires", d.expiry],
      ].map(([k, v]) => `${k}: ${v}`),
      "",
      "What was checked",
      ...d.axes.map((axis) => `${axis[0]}: ${axis[2]} (${axis[1]})`),
      "",
      `Source: ${d.src}`,
      `Checked: ${checkedAt}`,
      "",
      "Illustrative sample data. This report is not a real issuer verification.",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `VERIDOC-${resolvedReference || d.ref}.txt`;
    link.click();
    notify("Report downloaded.");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <section className="hero">
        <h1>Verify a credential.</h1>
        <p className="sample-context">
          Example register · Live issuer connections are not enabled.
        </p>
        <div className="search">
          <div
            className="tabs"
            role="tablist"
            aria-label="Verification method"
            style={{ "--active-tab": ["ref", "qr", "doc"].indexOf(method) }}
          >
            <span className="tab-indicator" aria-hidden="true" />
            {[
              ["ref", "Reference"],
              ["qr", "Scan QR"],
              ["doc", "Upload document"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="tab"
                role="tab"
                id={`tab-${key}`}
                aria-controls={`pane-${key}`}
                aria-selected={method === key}
                tabIndex={method === key ? 0 : -1}
                onClick={() => changeMethod(key)}
                onKeyDown={(event) => {
                  const keys = ["ref", "qr", "doc"];
                  let index = keys.indexOf(key);
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    index = (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                    changeMethod(keys[index]);
                    document.getElementById(`tab-${keys[index]}`)?.focus();
                  }
                }}
              >
                <Icon
                  name={
                    key === "ref" ? "search" : key === "qr" ? "qr" : "document"
                  }
                  size={18}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div
            key={method}
            className="method-panel"
            role="tabpanel"
            id={`pane-${method}`}
            aria-labelledby={`tab-${method}`}
          >
            {method === "ref" && (
              <form
                className="row"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  verify(reference, true);
                }}
              >
                <div
                  className={`reference-input ${inputError ? "has-error" : ""}`}
                >
                  <Icon name="search" size={20} />
                  <input
                    type="text"
                    value={reference}
                    onChange={(event) => {
                      setReference(event.target.value);
                      if (inputError) setInputError("");
                    }}
                    aria-label="Credential reference"
                    aria-invalid={Boolean(inputError)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    placeholder="VDC-CR-48210"
                    required
                  />
                  {reference && (
                    <button
                      className="input-clear"
                      type="button"
                      aria-label="Clear credential reference"
                      onClick={() => {
                        setReference("");
                        setInputError("");
                        document
                          .querySelector('[aria-label="Credential reference"]')
                          ?.focus();
                      }}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
                <button className="primary">
                  <Icon name="shield" size={18} />
                  Verify
                </button>
              </form>
            )}
            {method === "qr" && (
              <>
                <div className="row">
                  <div className="drop">
                    Point your camera at the credential QR.
                  </div>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setMessage("");
                      setScanning((value) => !value);
                    }}
                  >
                    {scanning ? "Stop scanning" : "Start scanning"}
                  </button>
                </div>
                {scanning && (
                  <video
                    className="scanner"
                    ref={video}
                    playsInline
                    muted
                    aria-label="Credential QR camera preview"
                  />
                )}
              </>
            )}
            {method === "doc" && (
              <div className="row">
                <div
                  className={`drop upload-drop ${dragging ? "is-dragging" : ""}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setDragging(false);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    selectFile(event.dataTransfer.files[0]);
                  }}
                >
                  <Icon name="upload" size={28} />
                  <strong>
                    {dragging ? "Drop document" : "Drop document"}
                  </strong>
                  <span>PDF, JPG, PNG or WebP · Up to 10 MB</span>
                </div>
                <button
                  type="button"
                  className="primary"
                  onClick={() => fileInput.current.click()}
                >
                  Choose file
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => selectFile(event.target.files[0])}
                />
              </div>
            )}
          </div>
          <ErrorText>{inputError}</ErrorText>
          {selectedFile && method === "doc" && (
            <div className="selected-file">
              <Icon name="document" />
              <span>
                <strong>{selectedFile.name}</strong>
                <small>
                  {(selectedFile.size / 1024).toFixed(0)} KB · Selected locally
                </small>
              </span>
              <button
                className="icon-button"
                type="button"
                aria-label="Remove selected file"
                onClick={() => {
                  setSelectedFile(null);
                  setMessage("");
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          )}
          {message && (
            <p className="note" role="status">
              {message}
            </p>
          )}
        </div>
        <div className="samples" role="group" aria-label="Sample outcomes">
          <span className="samples-label">Samples</span>
          {outcomes.map(([key, label]) => (
            <button
              className="chip"
              key={key}
              aria-pressed={result === key}
              onClick={() => verify(DATA[key].ref)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="grid result-grid" aria-live="polite">
        <article
          ref={resultPanel}
          className="card verification-card"
          key={resultVersion}
        >
          <Banner tone={d.cls.slice(2)} icon={d.ic} title={d.title}>
            {d.msg}
          </Banner>
          <Details
            rows={[
              ["Credential", d.cred],
              ["Holder", d.holder],
              ["Reference", result === "notfound" ? resolvedReference : d.ref],
              ["Issued", d.issued],
              ["Expires", d.expiry],
            ]}
          />
          <h3>Checks</h3>
          <ul className="axis">
            {d.axes.map(([name, detail, status, tone]) => (
              <li key={name}>
                <div>{name}</div>
                <Tag tone={tone}>{status}</Tag>
              </li>
            ))}
          </ul>
          <details className="disclosure verification-evidence">
            <summary>Check details</summary>
            <ul className="axis">
              {d.axes.map(([name, detail]) => (
                <li key={name}>
                  <div>
                    {name}
                    <small>{detail}</small>
                  </div>
                </li>
              ))}
            </ul>
            <p>Source: {d.src}.</p>
            <p>Checked {checkedAt}. Covers the fields shown.</p>
          </details>
          <div className="actions">
            <button className="btn-primary" onClick={() => navigate("holder")}>
              <Icon name="link" size={18} />
              Share
            </button>
            <button className="ghost" onClick={download}>
              <Icon name="download" size={18} />
              Download
            </button>
            <button className="ghost" onClick={() => navigate("appeals")}>
              <Icon name="appeals" size={18} />
              Report issue
            </button>
          </div>
        </article>
        <InstitutionSeal />
      </section>
    </>
  );
}
