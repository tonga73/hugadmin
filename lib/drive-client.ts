// lib/drive-client.ts — Shared Google Drive OAuth2 client
import { google } from "googleapis";

let _client: ReturnType<typeof google.drive> | null = null;

export function getDriveClient() {
  if (_client) return _client;

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

  _client = google.drive({ version: "v3", auth: oauth2 });
  return _client;
}
