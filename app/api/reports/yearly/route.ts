import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildYearlySummaryPdf } from "@/lib/pdf";

export async function GET(req: Request) {
  const user = await requireRole("admin");
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const summary = await db.yearlySummary(user.society_id, year);
  const society = await db.getSociety(user.society_id);
  if (!society) return NextResponse.json({ error: "Society not found" }, { status: 404 });
  const pdf = buildYearlySummaryPdf({ society, ...summary });
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="financial-summary-${year}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
