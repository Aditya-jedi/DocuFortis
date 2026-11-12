export function getAuditDetails(req) {
  const details = {
    ipAddress:
      req.ip ||
      req.socket?.remoteAddress ||
      null,

    userAgent:
      req.get("user-agent") ||
      req.headers["user-agent"] ||
      null,
  };



  return details;
}