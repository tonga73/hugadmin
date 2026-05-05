import { syncDrive, renewDriveWebhookIfNeeded } from "@/lib/drive-sync";

// Cron job endpoint — called by Railway Cron every 6 hours
// Schedule: 0 */6 * * *
// Command: curl -H "Authorization: Bearer $CRON_SECRET" https://<app-url>/api/cron/sync
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Renew the Drive webhook channel if it's expiring within 2 days
    await renewDriveWebhookIfNeeded();

    const result = await syncDrive();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
