
import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const SUPPORTED_PREVIEW_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "text/plain",
];

function getFilename(response) {
  const disposition =
    response.headers.get("Content-Disposition") || "";

  const encodedMatch = disposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      // Use the regular filename fallback.
    }
  }

  const regularMatch = disposition.match(
    /filename="?([^";]+)"?/i
  );

  return regularMatch?.[1] || "shared-document";
}

async function getErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

function normalizeMimeType(type) {
  if (type === "image/jpg") {
    return "image/jpeg";
  }

  return type?.split(";")[0].trim().toLowerCase() || "";
}

export default function SharedDocument({ token }) {
  const [message, setMessage] = useState(
    "Checking sharing link..."
  );
  const [accessStatus, setAccessStatus] = useState("checking");
  const [permission, setPermission] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setAccessStatus("checking");
      setPermission(null);
      setPreviewUrl(null);
      setPreviewText("");
      setPreviewType("");
      setMessage("Checking sharing link...");

      if (!token) {
        setAccessStatus("unavailable");
        setMessage("Invalid sharing link.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/shares/${encodeURIComponent(token)}/access`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              "This sharing link is expired or unavailable."
            )
          );
        }

        const data = await response.json();

        if (
          !["VIEW", "VIEW_AND_DOWNLOAD"].includes(
            data.permission
          )
        ) {
          throw new Error(
            "The sharing link has an invalid permission."
          );
        }

        const fileType = normalizeMimeType(
          data.document?.mimeType
        );

        if (!SUPPORTED_PREVIEW_TYPES.includes(fileType)) {
          throw new Error(
            "Preview is not supported for this file type."
          );
        }

        if (!cancelled) {
          setPermission(data.permission);
          setDocumentName(
            data.document?.originalName || "Shared document"
          );
          setMimeType(fileType);
          setAccessStatus("authorized");
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setAccessStatus("unavailable");
          setMessage(error.message);
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handlePreview() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/shares/${encodeURIComponent(token)}/preview`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to preview this document."
          )
        );
      }

      const blob = await response.blob();
      const responseType = normalizeMimeType(
        blob.type || mimeType
      );

      if (!SUPPORTED_PREVIEW_TYPES.includes(responseType)) {
        throw new Error(
          "The server returned an unsupported preview format."
        );
      }

      if (responseType === "text/plain") {
        const text = await blob.text();

        setPreviewUrl(null);
        setPreviewText(text);
        setPreviewType("text");
      } else {
        const url = URL.createObjectURL(blob);

        setPreviewText("");
        setPreviewType(
          responseType === "application/pdf"
            ? "pdf"
            : "image"
        );
        setPreviewUrl(url);
      }
    } catch (error) {
      if (
        /expired|unavailable|revoked|not authorized|unauthorized/i.test(
          error.message
        )
      ) {
        setAccessStatus("unavailable");
      }

      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/shares/${encodeURIComponent(token)}/download`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to download this document."
          )
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = getFilename(response);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      if (
        /expired|unavailable|revoked|not authorized|unauthorized/i.test(
          error.message
        )
      ) {
        setAccessStatus("unavailable");
      }

      setMessage(error.message);
    } finally {
      setDownloading(false);
    }
  }

  if (accessStatus === "checking") {
    return (
      <main className="shared-document-page">
        <section className="upload-card">
          <h2>Checking Sharing Link</h2>
          <p>{message}</p>
        </section>
      </main>
    );
  }

  if (accessStatus === "unavailable") {
    return (
      <main className="shared-document-page">
        <section className="upload-card">
          <h2>Sharing Link Unavailable</h2>
          <p>{message}</p>
          <p>
            This document may have been revoked, expired,
            deleted, or shared with another account.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shared-document-page">
      <section className="upload-card">
        <h2>Shared Document</h2>

        <p>
          You have been given access to a document through
          DocuFortis.
        </p>

        {documentName && (
          <p>
            <strong>Document:</strong> {documentName}
          </p>
        )}

        <p>
          <strong>Permission:</strong>{" "}
          {permission === "VIEW"
            ? "View only"
            : "View and download"}
        </p>

        <div className="shared-document-actions">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? "Loading..." : "Preview Document"}
          </button>

          {permission === "VIEW_AND_DOWNLOAD" && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading
                ? "Downloading..."
                : "Download Document"}
            </button>
          )}
        </div>

        {message && <p>{message}</p>}

        {previewUrl && previewType === "pdf" && (
          <div className="shared-document-preview">
            <iframe
              src={previewUrl}
              title="Shared PDF Preview"
              width="100%"
              height="650"
            />
          </div>
        )}

        {previewUrl && previewType === "image" && (
          <div className="shared-document-preview">
            <img
              src={previewUrl}
              alt={documentName}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "650px",
                width: "auto",
                height: "auto",
                margin: "0 auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {previewType === "text" && (
          <div className="shared-document-preview">
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                maxHeight: "650px",
                overflowY: "auto",
                padding: "16px",
                textAlign: "left",
              }}
            >
              {previewText}
            </pre>
          </div>
        )}
      </section>
    </main>
  );
}
