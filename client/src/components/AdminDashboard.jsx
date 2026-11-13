
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatBytes = (bytes = 0) => {
  const value = Number(bytes) || 0;

  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(2)} MB`;

  return `${(value / 1024 ** 3).toFixed(2)} GB`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
};

const shortId = (value) =>
  value ? `${value.slice(0, 8)}…` : "—";

function StatCard({ label, value, detail }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function EmptyState({ children = "No records found." }) {
  return <div className="admin-empty">{children}</div>;
}

function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deletedDocuments, setDeletedDocuments] = useState([]);
  const [shares, setShares] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/admin${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Admin request failed.");
    }

    return data;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        overviewData,
        usersData,
        documentsData,
        deletedData,
        sharesData,
        upgradesData,
        logsData,
      ] = await Promise.all([
        request("/overview"),
        request("/users?limit=100"),
        request("/documents?limit=100"),
        request("/documents/deleted?limit=100"),
        request("/shares?limit=100"),
        request("/upgrade-requests?limit=100"),
        request("/audit-logs?limit=100"),
      ]);

      setOverview(overviewData.overview || null);
      setUsers(usersData.users || []);
      setDocuments(documentsData.documents || []);
      setDeletedDocuments(deletedData.documents || []);
      setShares(sharesData.shares || []);
      setUpgradeRequests(upgradesData.requests || []);
      setAuditLogs(logsData.logs || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const pendingRequests = useMemo(
    () =>
      upgradeRequests.filter(
        (item) => item.status === "PENDING"
      ),
    [upgradeRequests]
  );

  async function reviewRequest(requestId, decision) {
    const action =
      decision === "APPROVED" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this upgrade request?`
      )
    ) {
      return;
    }

    setBusyId(requestId);
    setNotice("");
    setError("");

    try {
      const data = await request(
        `/upgrade-requests/${requestId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ decision }),
        }
      );

      setNotice(data.message || "Upgrade request updated.");

      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function revokePremium(item) {
    const confirmed = window.confirm(
      `Revoke Premium access from ${item.name || item.email}?\n\nTheir account will return to the FREE plan, with its 60 MB storage quota. Any pending upgrade requests from this account will also be rejected.`
    );

    if (!confirmed) return;

    setBusyId(item.id);
    setNotice("");
    setError("");

    try {
      const data = await request(
        `/users/${item.id}/revoke-premium`,
        {
          method: "PATCH",
        }
      );

      setNotice(data.message || "Premium access revoked successfully.");

      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function permanentlyDelete(document) {
    const shareWarning = document.shareCount
      ? ` This will also remove ${document.shareCount} associated sharing record(s).`
      : "";

    const confirmed = window.confirm(
      `Permanently delete “${document.originalName}”? This cannot be undone.${shareWarning}`
    );

    if (!confirmed) return;

    setBusyId(document.id);
    setNotice("");
    setError("");

    try {
      const data = await request(
        `/documents/${document.id}/permanent`,
        {
          method: "DELETE",
        }
      );

      setNotice(
        data.message || "Document permanently deleted."
      );

      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  const navItems = [
    ["overview", "Overview"],
    ["users", "Users"],
    ["documents", "Documents"],
    ["deleted", "Deleted documents"],
    ["sharing", "Sharing"],
    [
      "upgrades",
      `Upgrade requests${
        pendingRequests.length
          ? ` (${pendingRequests.length})`
          : ""
      }`,
    ],
    ["audit", "Audit logs"],
  ];

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link to="/home" className="admin-brand" aria-label="Go to DocuFortis home">
          <div className="admin-brand-mark">D</div>

          <div>
            <strong>DocuFortis</strong>
            <span>by Code Syndicate · Administration</span>
          </div>
        </Link>

        <div className="admin-account">
          <div>
            <strong>{user?.name || "Administrator"}</strong>
            <span>{user?.email}</span>
          </div>

          <span className="admin-role-pill">ADMIN</span>

          <button
            type="button"
            className="admin-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">
            CONTROL PANEL
          </p>

          {navItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                activeSection === key ? "active" : ""
              }
              onClick={() => setActiveSection(key)}
            >
              {label}
            </button>
          ))}

          <div className="admin-sidebar-bottom">
            <span>Privileged access</span>
            <small>
              Administrative actions are recorded in audit logs.
            </small>
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-page-heading">
            <div>
              <p>DOCUFORTIS / ADMIN</p>

              <h1>
                {navItems.find(
                  ([key]) => key === activeSection
                )?.[1] || "Overview"}
              </h1>

              <span>
                Monitor and manage the platform.
              </span>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={loadAll}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>

          {error && (
            <div className="admin-alert error" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div
              className="admin-alert success"
              role="status"
            >
              {notice}
            </div>
          )}

          {activeSection === "overview" && (
            <>
              <div className="admin-stats-grid">
                <StatCard
                  label="Total users"
                  value={overview?.totalUsers}
                  detail={`${overview?.freeUsers ?? 0} Free · ${
                    overview?.premiumUsers ?? 0
                  } Premium`}
                />

                <StatCard
                  label="Documents"
                  value={overview?.totalDocuments}
                  detail={`${overview?.activeDocuments ?? 0} active · ${
                    overview?.deletedDocuments ?? 0
                  } deleted`}
                />

                <StatCard
                  label="Active storage"
                  value={formatBytes(
                    overview?.activeStorageBytes
                  )}
                />

                <StatCard
                  label="Pending upgrades"
                  value={overview?.pendingUpgradeRequests}
                />

                <StatCard
                  label="Sharing records"
                  value={overview?.totalShares}
                />

                <StatCard
                  label="Audit events"
                  value={overview?.totalAuditEvents}
                />
              </div>

              <div className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Platform snapshot</h2>
                  <span>Latest loaded data</span>
                </div>

                <div className="admin-snapshot-grid">
                  <div>
                    <span>Free accounts</span>
                    <strong>
                      {overview?.freeUsers ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Premium accounts</span>
                    <strong>
                      {overview?.premiumUsers ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Active documents</span>
                    <strong>
                      {overview?.activeDocuments ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Deleted documents</span>
                    <strong>
                      {overview?.deletedDocuments ?? "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "users" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Registered users</h2>
                <span>{users.length} shown · max 100</span>
              </div>

              {users.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Plan</th>
                        <th>Storage used</th>
                        <th>MFA</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.name || "Unnamed user"}
                            </strong>
                            <small>{item.email}</small>
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.role === "ADMIN"
                                  ? "gold"
                                  : "neutral"
                              }`}
                            >
                              {item.role}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.plan === "PREMIUM"
                                  ? "green"
                                  : "neutral"
                              }`}
                            >
                              {item.plan}
                            </span>
                          </td>

                          <td>
                            {formatBytes(item.storageUsedBytes)}
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.mfaEnabled
                                  ? "green"
                                  : "neutral"
                              }`}
                            >
                              {item.mfaEnabled
                                ? "Enabled"
                                : "Off"}
                            </span>
                          </td>

                          <td>{formatDate(item.createdAt)}</td>

                          <td>
                            {item.role === "USER" &&
                            item.plan === "PREMIUM" ? (
                              <button
                                type="button"
                                className="admin-danger-button"
                                disabled={busyId === item.id}
                                onClick={() => revokePremium(item)}
                              >
                                {busyId === item.id
                                  ? "Revoking…"
                                  : "Revoke Premium"}
                              </button>
                            ) : (
                              <span className="admin-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === "documents" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <h2>All documents</h2>
                <span>
                  {documents.length} shown · max 100
                </span>
              </div>

              {documents.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Owner</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Shares</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>

                    <tbody>
                      {documents.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.originalName}</strong>
                            <small>
                              {item.mimeType} · {shortId(item.id)}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {item.owner?.name || "Unknown"}
                            </strong>
                            <small>{item.owner?.email}</small>
                          </td>

                          <td>{formatBytes(item.sizeBytes)}</td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.status === "ACTIVE"
                                  ? "green"
                                  : "neutral"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td>{item.shareCount}</td>
                          <td>{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === "deleted" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Deleted documents</h2>
                  <p>
                    These records have been soft-deleted.
                    Permanent deletion removes the stored file
                    and database record.
                  </p>
                </div>

                <span>{deletedDocuments.length} shown</span>
              </div>

              {deletedDocuments.length === 0 ? (
                <EmptyState>
                  No documents are awaiting permanent deletion.
                </EmptyState>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Owner</th>
                        <th>Size</th>
                        <th>Deleted on</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deletedDocuments.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.originalName}</strong>
                            <small>
                              {item.mimeType} · {shortId(item.id)}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {item.owner?.name || "Unknown"}
                            </strong>
                            <small>{item.owner?.email}</small>
                          </td>

                          <td>{formatBytes(item.sizeBytes)}</td>
                          <td>{formatDate(item.deletedAt)}</td>

                          <td>
                            <button
                              type="button"
                              className="admin-danger-button"
                              disabled={busyId === item.id}
                              onClick={() =>
                                permanentlyDelete(item)
                              }
                            >
                              {busyId === item.id
                                ? "Deleting…"
                                : "Permanently delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="admin-caution">
                Permanent deletion cannot be undone. Any sharing
                records attached to the document are deleted as well.
              </p>
            </div>
          )}

          {activeSection === "sharing" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Sharing records</h2>
                <span>{shares.length} shown · max 100</span>
              </div>

              {shares.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Created by</th>
                        <th>Recipient</th>
                        <th>Permission</th>
                        <th>Expires</th>
                        <th>State</th>
                      </tr>
                    </thead>

                    <tbody>
                      {shares.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.document?.originalName ||
                                "Document removed"}
                            </strong>
                            <small>{shortId(item.id)}</small>
                          </td>

                          <td>
                            <strong>
                              {item.createdBy?.name || "Unknown"}
                            </strong>
                            <small>{item.createdBy?.email}</small>
                          </td>

                          <td>
                            {item.recipient?.email ||
                              item.recipientEmail ||
                              "Anyone with link"}
                          </td>

                          <td>{item.permission}</td>
                          <td>{formatDate(item.expiresAt)}</td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.isRevoked || item.isExpired
                                  ? "neutral"
                                  : "green"
                              }`}
                            >
                              {item.isRevoked
                                ? "Revoked"
                                : item.isExpired
                                  ? "Expired"
                                  : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === "upgrades" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Premium upgrade requests</h2>
                  <p>
                    Approval is available only after the demo
                    payment status is successful.
                  </p>
                </div>

                <span>{upgradeRequests.length} shown</span>
              </div>

              {upgradeRequests.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Payment</th>
                        <th>Request status</th>
                        <th>Submitted</th>
                        <th>Review</th>
                      </tr>
                    </thead>

                    <tbody>
                      {upgradeRequests.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.user?.name || "Unknown"}
                            </strong>
                            <small>{item.user?.email}</small>
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                item.paymentStatus === "SUCCESS"
                                  ? "green"
                                  : "neutral"
                              }`}
                            >
                              {item.paymentStatus}
                            </span>
                            <small>
                              {item.paymentReference ||
                                "No reference"}
                            </small>
                          </td>

                          <td>{item.status}</td>
                          <td>{formatDate(item.createdAt)}</td>

                          <td>
                            {item.status === "PENDING" ? (
                              <div className="admin-action-group">
                                <button
                                  type="button"
                                  disabled={
                                    busyId === item.id ||
                                    item.paymentStatus !== "SUCCESS"
                                  }
                                  onClick={() =>
                                    reviewRequest(
                                      item.id,
                                      "APPROVED"
                                    )
                                  }
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  className="admin-secondary-button"
                                  disabled={busyId === item.id}
                                  onClick={() =>
                                    reviewRequest(
                                      item.id,
                                      "REJECTED"
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="admin-muted">
                                Reviewed {formatDate(item.reviewedAt)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="admin-caution">
                The current payment flow is a demonstration
                simulator, not a real payment gateway.
              </p>
            </div>
          )}

          {activeSection === "audit" && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Audit logs</h2>
                <span>
                  Latest {auditLogs.length} events · max 100
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Actor</th>
                        <th>Entity</th>
                        <th>IP address</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditLogs.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.action}</strong>
                            {item.metadata?.operation && (
                              <small>
                                {item.metadata.operation}
                              </small>
                            )}
                          </td>

                          <td>
                            <strong>
                              {item.user?.name ||
                                "System / unavailable"}
                            </strong>
                            <small>
                              {item.user?.email || "—"}
                            </small>
                          </td>

                          <td>
                            {item.entityType || "—"}
                            <small>{shortId(item.entityId)}</small>
                          </td>

                          <td>{item.ipAddress || "—"}</td>
                          <td>{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="admin-caution">
                Authentication secrets, session tokens and
                share-token hashes are not exposed in this panel.
              </p>
            </div>
          )}

          {loading && (
            <p className="admin-loading-note">
              Loading administrative data…
            </p>
          )}

          <footer className="admin-footer">
            DocuFortis · Restricted administrator workspace
          </footer>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
