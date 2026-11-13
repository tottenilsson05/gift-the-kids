import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { getTokenStatus } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/token — lightweight proxy for launch status + market data.
 * Cached in memory (10s) and at the Vercel edge (s-maxage=10).
 */
export async function GET() {
  try {
    const data = await getTokenStatus(siteConfig.tokenAddress);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json(
      { error: "Data unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
