
import { google } from "googleapis";

function getGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}

function encodeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export async function sendEmail({ to, subject, text }) {
  if (!to || !subject || !text) {
    throw new Error("Recipient, subject, and email text are required.");
  }

  const sender = process.env.GMAIL_SENDER_EMAIL;

  if (!sender) {
    throw new Error("GMAIL_SENDER_EMAIL is not configured.");
  }

  const gmail = getGmailClient();

  const message = [
    `From: DocuFortis <${sender}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
  ].join("\r\n");

  const raw = Buffer.from(message).toString("base64url");

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return {
      success: true,
      messageId: result.data.id,
    };
  } catch (error) {
    console.error("Gmail email sending failed:", error.message);
    throw new Error("Unable to send email.");
  }
}
