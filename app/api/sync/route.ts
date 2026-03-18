// app/api/sync/route.ts — Trigger Drive sync
import { NextResponse } from "next/server";
import { syncDrive } from "@/lib/drive-sync";

export async function POST() {
  try {
    const result = await syncDrive();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
