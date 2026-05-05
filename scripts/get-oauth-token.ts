/**
 * scripts/get-oauth-token.ts
 *
 * One-time script to authorize the app to access Google Drive as a specific user.
 * Run with: npx tsx scripts/get-oauth-token.ts
 *
 * Requirements:
 *   GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be in .env
 *
 * Steps:
 *   1. Run this script
 *   2. Send the printed URL to the Drive account owner (hugomitoire@gmail.com)
 *   3. They open it, sign in with their Google account, and click "Allow"
 *   4. Their browser will try to load http://localhost:3001/... and fail (that's OK)
 *   5. They copy the full URL from the browser's address bar and send it back to you
 *   6. Paste that URL here when prompted
 *   7. The script prints the GOOGLE_OAUTH_REFRESH_TOKEN — save it in .env
 */

import "dotenv/config";
import * as readline from "readline";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌  GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set in .env");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3001/oauth2callback";

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
  prompt: "consent", // Force refresh_token to be returned every time
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n=== Google Drive OAuth2 Setup ===\n");
console.log("1. Mandá esta URL a la persona dueña de la cuenta de Drive:");
console.log(`\n   ${authUrl}\n`);
console.log("2. Ellos abren esa URL, inician sesión y hacen click en 'Permitir'.");
console.log("3. Su browser va a intentar cargar http://localhost:3001/... y va a fallar (es normal).");
console.log("4. Deben copiar la URL completa de la barra del browser y mandártela.");
console.log("5. Pegá esa URL acá:\n");

rl.question("> ", async (input) => {
  rl.close();

  let code = input.trim();

  // Extract code from URL if the user pasted the full redirect URL
  if (code.includes("code=")) {
    try {
      const parsed = new URL(code);
      code = parsed.searchParams.get("code") ?? code;
    } catch {
      const match = code.match(/[?&]code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      console.error("\n❌  No se recibió refresh_token. Asegurate de haber usado prompt: 'consent'.");
      console.error("    Si ya autorizaste antes, revocá el acceso en myaccount.google.com/permissions y volvé a correr el script.\n");
      process.exit(1);
    }

    console.log("\n✅  Autorizado. Agregá esta variable a tu .env (y a Railway):\n");
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
  } catch (err) {
    console.error("\n❌  Error al obtener el token:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
});
