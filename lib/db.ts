// Supabase-backed data layer.
// Every page/server-action talks to this module via the exported `db` object.
// All methods are async (return Promises) — call sites must `await` them.
//
// Authorisation is enforced by Postgres RLS, not by this module.

import { supabaseServer } from "./supabase";
import type {
  Bill,
  Booking,
  Complaint,
  Contact,
  Expense,
  Facility,
  Flat,
  Notice,
  Society,
  User,
  Visitor,
} from "./types";

function client() {
  return supabaseServer();
}

function todayISO(): string {
  return new Date().toISOString();
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function fmtPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function nextSerial(): Promise<string> {
  const { data } = await client()
    .from("bills")
    .select("serial_no")
    .not("serial_no", "is", null)
    .order("serial_no", { ascending: false })
    .limit(1);
  const last = data?.[0]?.serial_no as string | undefined;
  const n = last ? Number(last.replace(/^RCPT-/, "")) || 1000 : 1000;
  return `RCPT-${n + 1}`;
}

export const db = {
  // Users
  async listUsers(societyId: string): Promise<User[]> {
    const { data } = await client()
      .from("app_users")
      .select("*")
      .eq("society_id", societyId)
      .order("name");
    return (data ?? []) as User[];
  },
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await client().from("app_users").select("*").eq("id", id).maybeSingle();
    return (data ?? undefined) as User | undefined;
  },

  // Society
  async getSociety(id: string): Promise<Society | undefined> {
    const { data } = await client().from("societies").select("*").eq("id", id).maybeSingle();
    return (data ?? undefined) as Society | undefined;
  },

  // Flats
  async listFlats(societyId: string): Promise<Flat[]> {
    const { data } = await client()
      .from("flats")
      .select("*")
      .eq("society_id", societyId)
      .order("block")
      .order("number");
    return (data ?? []) as Flat[];
  },
  async getFlat(id: string): Promise<Flat | undefined> {
    const { data } = await client().from("flats").select("*").eq("id", id).maybeSingle();
    return (data ?? undefined) as Flat | undefined;
  },
  async addFlats(
    rows: Array<{ block: string; number: string; ownerEmail?: string; ownerName?: string }>,
    societyId: string,
  ): Promise<number> {
    const sb = client();
    let added = 0;
    for (const row of rows) {
      const { data: exists } = await sb
        .from("flats")
        .select("id")
        .eq("society_id", societyId)
        .eq("block", row.block)
        .eq("number", row.number)
        .maybeSingle();
      if (exists) continue;

      let ownerId: string | null = null;
      if (row.ownerEmail) {
        const { data: user } = await sb
          .from("app_users")
          .select("id")
          .ilike("email", row.ownerEmail)
          .maybeSingle();
        if (user) {
          ownerId = user.id as string;
        } else {
          const { data: created } = await sb
            .from("app_users")
            .insert({
              email: row.ownerEmail,
              name: row.ownerName ?? row.ownerEmail,
              role: "resident",
              society_id: societyId,
            })
            .select("id")
            .single();
          ownerId = created?.id as string;
        }
      }

      const { data: flat } = await sb
        .from("flats")
        .insert({ society_id: societyId, block: row.block, number: row.number, owner_user_id: ownerId })
        .select("id")
        .single();
      if (ownerId && flat) {
        await sb.from("app_users").update({ flat_id: flat.id }).eq("id", ownerId);
      }
      added++;
    }
    return added;
  },

  // Bills
  async listBills(societyId: string, period?: string, flatIds?: string[]): Promise<Bill[]> {
    const sb = client();
    if (!flatIds) {
      const flats = await this.listFlats(societyId);
      flatIds = flats.map((f) => f.id);
    }
    if (flatIds.length === 0) return [];
    let q = sb.from("bills").select("*").in("flat_id", flatIds).order("period", { ascending: false });
    if (period) q = q.eq("period", period);
    const { data } = await q;
    return (data ?? []) as Bill[];
  },
  async listBillsForFlat(flatId: string): Promise<Bill[]> {
    const { data } = await client()
      .from("bills")
      .select("*")
      .eq("flat_id", flatId)
      .order("period", { ascending: false });
    return (data ?? []) as Bill[];
  },
  async getBill(id: string): Promise<Bill | undefined> {
    const { data } = await client().from("bills").select("*").eq("id", id).maybeSingle();
    return (data ?? undefined) as Bill | undefined;
  },
  async generateBillsForPeriod(societyId: string, period: string, baseAmount = 3000): Promise<number> {
    const sb = client();
    const flats = await this.listFlats(societyId);
    let created = 0;
    for (const flat of flats) {
      const { data: existing } = await sb
        .from("bills")
        .select("id")
        .eq("flat_id", flat.id)
        .eq("period", period)
        .maybeSingle();
      if (existing) continue;

      // Pull approved-but-unbilled facility bookings for this flat.
      const { data: pending } = await sb
        .from("bookings")
        .select("id, facility_id, date")
        .eq("flat_id", flat.id)
        .eq("status", "approved")
        .eq("fee_billed", false);

      const lineItems: Array<{ label: string; amount: number }> = [
        { label: "Maintenance", amount: baseAmount },
      ];
      let amount = baseAmount;
      for (const bk of pending ?? []) {
        const { data: fac } = await sb
          .from("facilities")
          .select("name, fee")
          .eq("id", bk.facility_id)
          .maybeSingle();
        if (!fac) continue;
        lineItems.push({ label: `${fac.name} booking (${bk.date})`, amount: fac.fee });
        amount += fac.fee;
        await sb.from("bookings").update({ fee_billed: true }).eq("id", bk.id);
      }

      await sb.from("bills").insert({
        flat_id: flat.id,
        period,
        amount,
        status: "unpaid",
        due_date: `${period}-15`,
        line_items: lineItems.length > 1 ? lineItems : null,
      });
      created++;
    }
    return created;
  },
  async markBillPaid(billId: string): Promise<boolean> {
    const sb = client();
    const { data: bill } = await sb.from("bills").select("status").eq("id", billId).maybeSingle();
    if (!bill || bill.status === "paid") return false;
    const serial = await nextSerial();
    const { error } = await sb
      .from("bills")
      .update({ status: "paid", paid_at: todayISO(), serial_no: serial })
      .eq("id", billId);
    return !error;
  },
  async defaulters(
    societyId: string,
    minUnpaidMonths = 3,
  ): Promise<Array<{ flat: Flat; owner: User | undefined; unpaidCount: number; outstanding: number }>> {
    // Single bulk fetch instead of N+1 per-flat queries
    const [flats, owners, allBills] = await Promise.all([
      this.listFlats(societyId),
      this.listUsers(societyId),
      this.listBills(societyId),
    ]);
    const ownerById = new Map(owners.map((u) => [u.id, u] as const));
    const unpaidByFlat = new Map<string, Bill[]>();
    for (const b of allBills) {
      if (b.status !== "unpaid") continue;
      if (!unpaidByFlat.has(b.flat_id)) unpaidByFlat.set(b.flat_id, []);
      unpaidByFlat.get(b.flat_id)!.push(b);
    }
    const out: Array<{ flat: Flat; owner: User | undefined; unpaidCount: number; outstanding: number }> = [];
    for (const flat of flats) {
      const unpaid = unpaidByFlat.get(flat.id) ?? [];
      if (unpaid.length >= minUnpaidMonths) {
        out.push({
          flat,
          owner: flat.owner_user_id ? ownerById.get(flat.owner_user_id) : undefined,
          unpaidCount: unpaid.length,
          outstanding: unpaid.reduce((s, b) => s + b.amount, 0),
        });
      }
    }
    return out.sort((a, b) => b.unpaidCount - a.unpaidCount);
  },
  async trafficLight(societyId: string) {
    // Single bulk fetch instead of N+1 per-flat queries
    const [flats, owners, allBills] = await Promise.all([
      this.listFlats(societyId),
      this.listUsers(societyId),
      this.listBills(societyId),
    ]);
    const ownerById = new Map(owners.map((u) => [u.id, u] as const));
    const unpaidByFlat = new Map<string, Bill[]>();
    for (const b of allBills) {
      if (b.status !== "unpaid") continue;
      if (!unpaidByFlat.has(b.flat_id)) unpaidByFlat.set(b.flat_id, []);
      unpaidByFlat.get(b.flat_id)!.push(b);
    }
    const period = currentPeriod();
    const green: Array<{ flat: Flat; owner?: User }> = [];
    const yellow: Array<{ flat: Flat; owner?: User; unpaidCount: number; outstanding: number }> = [];
    const red: Array<{ flat: Flat; owner?: User; unpaidCount: number; outstanding: number }> = [];
    for (const flat of flats) {
      const owner = flat.owner_user_id ? ownerById.get(flat.owner_user_id) : undefined;
      const unpaid = unpaidByFlat.get(flat.id) ?? [];
      const unpaidCount = unpaid.length;
      const outstanding = unpaid.reduce((s, b) => s + b.amount, 0);
      if (unpaidCount >= 3) {
        red.push({ flat, owner, unpaidCount, outstanding });
      } else if (unpaidCount === 0) {
        green.push({ flat, owner });
      } else if (unpaidCount === 1 && unpaid[0].period === period) {
        yellow.push({ flat, owner, unpaidCount, outstanding });
      } else {
        yellow.push({ flat, owner, unpaidCount, outstanding });
      }
    }
    return { green, yellow, red };
  },
  async monthlyCollection(
    societyId: string,
    months = 6,
  ): Promise<Array<{ period: string; collected: number; outstanding: number }>> {
    // Single fetch for all bills, then bucket by period in JS
    const allBills = await this.listBills(societyId);
    const out: Array<{ period: string; collected: number; outstanding: number }> = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const periodBills = allBills.filter((b) => b.period === period);
      out.push({
        period,
        collected: periodBills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0),
        outstanding: periodBills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0),
      });
    }
    return out;
  },
  async yearlySummary(societyId: string, year: number) {
    const allBills = await this.listBills(societyId);
    const bills = allBills.filter((b) => b.period.startsWith(`${year}-`));
    const allExpenses = await this.listExpenses(societyId);
    const expenses = allExpenses.filter((e) => e.spent_on.startsWith(`${year}-`));
    const collected = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
    const outstanding = bills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return { year, bills, expenses, collected, outstanding, totalExpenses, net: collected - totalExpenses };
  },

  // Expenses
  async listExpenses(societyId: string): Promise<Expense[]> {
    const { data } = await client()
      .from("expenses")
      .select("*")
      .eq("society_id", societyId)
      .order("spent_on", { ascending: false });
    return (data ?? []) as Expense[];
  },
  async addExpense(input: Omit<Expense, "id">): Promise<void> {
    await client().from("expenses").insert(input);
  },

  // Notices
  async listNotices(societyId: string): Promise<Notice[]> {
    const { data } = await client()
      .from("notices")
      .select("*")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Notice[];
  },
  async addNotice(input: Omit<Notice, "id" | "created_at">): Promise<void> {
    await client().from("notices").insert(input);
  },

  // Complaints
  async listComplaints(societyId: string): Promise<Array<Complaint & { flat: Flat | undefined }>> {
    const flats = await this.listFlats(societyId);
    const flatById = new Map(flats.map((f) => [f.id, f] as const));
    const flatIds = flats.map((f) => f.id);
    if (flatIds.length === 0) return [];
    const { data } = await client()
      .from("complaints")
      .select("*")
      .in("flat_id", flatIds)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Complaint[]).map((c) => ({ ...c, flat: flatById.get(c.flat_id) }));
  },
  async listComplaintsForFlat(flatId: string): Promise<Complaint[]> {
    const { data } = await client()
      .from("complaints")
      .select("*")
      .eq("flat_id", flatId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Complaint[];
  },
  async addComplaint(input: {
    flat_id: string;
    category: string;
    description: string;
    photo_url?: string | null;
  }): Promise<void> {
    await client().from("complaints").insert({
      flat_id: input.flat_id,
      category: input.category,
      description: input.description,
      status: "open",
      photo_url: input.photo_url ?? null,
    });
  },
  async resolveComplaint(id: string): Promise<boolean> {
    const { error } = await client()
      .from("complaints")
      .update({ status: "resolved", resolved_at: todayISO() })
      .eq("id", id);
    return !error;
  },

  // Contacts
  async listContacts(societyId: string): Promise<Contact[]> {
    const { data } = await client()
      .from("contacts")
      .select("*")
      .eq("society_id", societyId)
      .order("role")
      .order("name");
    return (data ?? []) as Contact[];
  },
  async addContact(input: Omit<Contact, "id">): Promise<void> {
    await client().from("contacts").insert(input);
  },
  async removeContact(id: string): Promise<boolean> {
    const { error } = await client().from("contacts").delete().eq("id", id);
    return !error;
  },

  // Facilities & bookings
  async listFacilities(societyId: string): Promise<Facility[]> {
    const { data } = await client().from("facilities").select("*").eq("society_id", societyId).order("name");
    return (data ?? []) as Facility[];
  },
  async getFacility(id: string): Promise<Facility | undefined> {
    const { data } = await client().from("facilities").select("*").eq("id", id).maybeSingle();
    return (data ?? undefined) as Facility | undefined;
  },
  async listBookings(societyId: string): Promise<Array<Booking & { facility?: Facility; flat?: Flat }>> {
    const facilities = await this.listFacilities(societyId);
    const facById = new Map(facilities.map((f) => [f.id, f] as const));
    const flats = await this.listFlats(societyId);
    const flatById = new Map(flats.map((f) => [f.id, f] as const));
    const facIds = facilities.map((f) => f.id);
    if (facIds.length === 0) return [];
    const { data } = await client()
      .from("bookings")
      .select("*")
      .in("facility_id", facIds)
      .order("date", { ascending: false });
    return ((data ?? []) as Booking[]).map((b) => ({
      ...b,
      facility: facById.get(b.facility_id),
      flat: flatById.get(b.flat_id),
    }));
  },
  async listBookingsForFlat(flatId: string): Promise<Array<Booking & { facility?: Facility }>> {
    const sb = client();
    const { data } = await sb
      .from("bookings")
      .select("*")
      .eq("flat_id", flatId)
      .order("date", { ascending: false });
    const bookings = (data ?? []) as Booking[];
    if (bookings.length === 0) return [];
    const facIds = Array.from(new Set(bookings.map((b) => b.facility_id)));
    const { data: facs } = await sb.from("facilities").select("*").in("id", facIds);
    const facById = new Map(((facs ?? []) as Facility[]).map((f) => [f.id, f] as const));
    return bookings.map((b) => ({ ...b, facility: facById.get(b.facility_id) }));
  },
  async isFacilityBooked(facilityId: string, date: string): Promise<boolean> {
    const { data } = await client()
      .from("bookings")
      .select("id")
      .eq("facility_id", facilityId)
      .eq("date", date)
      .neq("status", "rejected")
      .maybeSingle();
    return !!data;
  },
  async requestBooking(input: { facility_id: string; flat_id: string; date: string }): Promise<boolean> {
    if (await this.isFacilityBooked(input.facility_id, input.date)) return false;
    const { error } = await client().from("bookings").insert({
      facility_id: input.facility_id,
      flat_id: input.flat_id,
      date: input.date,
      status: "requested",
      fee_billed: false,
    });
    return !error;
  },
  async decideBooking(id: string, decision: "approved" | "rejected"): Promise<boolean> {
    const { error } = await client()
      .from("bookings")
      .update({ status: decision, decided_at: todayISO() })
      .eq("id", id)
      .eq("status", "requested");
    return !error;
  },

  // Visitors
  async listVisitorsForFlat(flatId: string): Promise<Visitor[]> {
    const { data } = await client()
      .from("visitors")
      .select("*")
      .eq("flat_id", flatId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Visitor[];
  },
  async listVisitorsForSociety(societyId: string): Promise<Array<Visitor & { flat?: Flat }>> {
    const flats = await this.listFlats(societyId);
    const flatById = new Map(flats.map((f) => [f.id, f] as const));
    const flatIds = flats.map((f) => f.id);
    if (flatIds.length === 0) return [];
    const { data } = await client()
      .from("visitors")
      .select("*")
      .in("flat_id", flatIds)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Visitor[]).map((v) => ({ ...v, flat: flatById.get(v.flat_id) }));
  },
  async createVisitor(input: { flat_id: string; name: string; purpose: string; expected_on: string }): Promise<void> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await client().from("visitors").insert({
      flat_id: input.flat_id,
      name: input.name,
      purpose: input.purpose,
      entry_code: code,
      status: "approved",
      expected_on: input.expected_on,
    });
  },
  async findVisitorByCode(code: string): Promise<Visitor | undefined> {
    const { data } = await client()
      .from("visitors")
      .select("*")
      .eq("entry_code", code.toUpperCase())
      .maybeSingle();
    return (data ?? undefined) as Visitor | undefined;
  },
  async markVisitorEntered(id: string): Promise<boolean> {
    const { error } = await client()
      .from("visitors")
      .update({ status: "entered", entered_at: todayISO() })
      .eq("id", id);
    return !error;
  },
};
