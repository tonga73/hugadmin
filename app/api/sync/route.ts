// app/api/sync/route.ts — Trigger Drive sync
import { NextResponse } from "next/server";
import { syncDrive } from "@/lib/drive-sync";

export async function POST() {
  try {
    const result = await syncDrive();
    return NextResponse.json(result);
  } catch (err) {
    const error = err as any;
    console.error("Sync error:", error?.message, error?.code, error?.status, error?.errors);
    return NextResponse.json(
      { error: error?.message, code: error?.code, status: error?.status },
      { status: 500 }
    );
  }
}
