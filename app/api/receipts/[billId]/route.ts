import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: { billId: string } }) {
  const user = await requireUser();
  const bill = await db.getBill(params.billId);
  if (!bill || bill.status !== "paid") {
    return NextResponse.json({ error: "Receipt not available" }, { status: 404 });
  }
  const flat = await db.getFlat(bill.flat_id);
  if (!flat) return NextResponse.json({ error: "Flat not found" }, { status: 404 });

  // Authorisation: residents can only see their own receipt; admins can see anything in their society.
  if (user.role === "resident" && user.flat_id !== flat.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role !== "admin" && user.role !== "resident") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const society = await db.getSociety(flat.society_id);
  if (!society) return NextResponse.json({ error: "Society not found" }, { status: 404 });
  const owner = flat.owner_user_id ? await db.getUser(flat.owner_user_id) : undefined;

  const pdf = buildReceiptPdf({ society, flat, owner, bill });
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${bill.serial_no ?? bill.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
