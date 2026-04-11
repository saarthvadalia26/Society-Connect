export type Role = "admin" | "resident" | "guard";
export type BillStatus = "unpaid" | "paid";
export type ComplaintStatus = "open" | "resolved";
export type VisitorStatus = "pending" | "approved" | "denied" | "entered";
export type BookingStatus = "requested" | "approved" | "rejected";

export interface Society {
  id: string;
  name: string;
  address: string;
  currency: string;
  logo_url: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  society_id: string;
  currency: string;
  flat_id: string | null;
}

export interface Flat {
  id: string;
  society_id: string;
  block: string;
  number: string;
  owner_user_id: string | null;
}

export interface Bill {
  id: string;
  flat_id: string;
  period: string; // YYYY-MM
  amount: number;
  status: BillStatus;
  due_date: string;
  paid_at: string | null;
  // v2 additions
  serial_no: string | null; // populated on payment
  line_items: Array<{ label: string; amount: number }> | null;
}

export interface Expense {
  id: string;
  society_id: string;
  category: string;
  vendor: string;
  amount: number;
  note: string | null;
  spent_on: string;
}

export interface Notice {
  id: string;
  society_id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  flat_id: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  resolved_at: string | null;
  // v2: photo as data URL (in-memory MVP). Swap for Supabase Storage later.
  photo_url: string | null;
}

export interface Contact {
  id: string;
  society_id: string;
  name: string;
  role: string; // e.g. Plumber, Electrician
  phone: string;
  rating: number; // 1..5
  notes: string | null;
}

export interface Facility {
  id: string;
  society_id: string;
  name: string;
  fee: number;
  description: string | null;
}

export interface Booking {
  id: string;
  facility_id: string;
  flat_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: BookingStatus;
  created_at: string;
  decided_at: string | null;
  fee_billed: boolean;
}

export interface Visitor {
  id: string;
  flat_id: string;
  name: string;
  purpose: string;
  entry_code: string; // 6-char human friendly
  status: VisitorStatus;
  created_at: string;
  expected_on: string; // YYYY-MM-DD
  entered_at: string | null;
}
