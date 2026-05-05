// app/api/sync/webhook/route.ts — Receives Google Drive Push Notifications
// Google calls this endpoint whenever a file changes in the watched Drive.
// Docs: https://developers.google.com/drive/api/guides/push

import { syncDriveIncremental } from "@/lib/drive-sync";

export async function POST(req: Request) {
  // Verify the request comes from our registered channel
  const channelToken = req.headers.get("x-goog-channel-token");
  const secret = process.env.DRIVE_WEBHOOK_SECRET;

  if (secret && channelToken !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resourceState = req.headers.get("x-goog-resource-state");

  // Google sends a "sync" ping when the channel is first registered — just acknowledge it
  if (resourceState === "sync") {
    return new Response(null, { status: 200 });
  }

  // Any other state ("change", "update", "trash", etc.) means files changed
  try {
    await syncDriveIncremental();
  } catch (err) {
    console.error("[drive-webhook] Incremental sync failed:", err);
    // Still return 200 so Google doesn't retry indefinitely
  }

  return new Response(null, { status: 200 });
}
