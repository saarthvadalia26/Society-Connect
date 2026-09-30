-- Society Connect — Security & Multi-Tenant Isolation Hardening Migration
-- Run this in your Supabase SQL Editor to enforce strict tenant isolation and patch privilege escalation.
-- This script is completely idempotent: it safely drops existing policies before recreating them.

-- ============================================================
-- 1. Helper function: Get the current authenticated user's profile row
-- ============================================================
create or replace function current_app_user()
returns app_users
language sql
stable
security definer
set search_path = public
as $$
  select au.* from app_users au
  join auth.users u on lower(u.email) = lower(au.email)
  where u.id = auth.uid()
  limit 1
$$;

-- ============================================================
-- 2. Drop all insecure & legacy write policies across all tables
-- ============================================================

-- app_users
drop policy if exists app_users_self_update on app_users;
drop policy if exists app_users_insert on app_users;
drop policy if exists app_users_admin_write on app_users;

-- flats
drop policy if exists flats_write on flats;
drop policy if exists flats_admin_write on flats;

-- bills
drop policy if exists bills_write on bills;
drop policy if exists bills_admin_write on bills;

-- expenses
drop policy if exists expenses_rw on expenses;
drop policy if exists expenses_admin on expenses;
drop policy if exists expenses_admin_write on expenses;

-- notices
drop policy if exists notices_write on notices;
drop policy if exists notices_admin_write on notices;

-- contacts
drop policy if exists contacts_write on contacts;
drop policy if exists contacts_admin on contacts;
drop policy if exists contacts_admin_write on contacts;

-- facilities
drop policy if exists facilities_write on facilities;
drop policy if exists facilities_admin on facilities;
drop policy if exists facilities_admin_write on facilities;

-- bookings
drop policy if exists bookings_write on bookings;
drop policy if exists bookings_rw on bookings;
drop policy if exists bookings_resident on bookings;
drop policy if exists bookings_resident_write on bookings;
drop policy if exists bookings_admin_manage on bookings;

-- complaints
drop policy if exists complaints_write on complaints;
drop policy if exists complaints_rw on complaints;
drop policy if exists complaints_resident on complaints;
drop policy if exists complaints_resident_insert on complaints;
drop policy if exists complaints_admin_manage on complaints;

-- visitors
drop policy if exists visitors_write on visitors;
drop policy if exists visitors_rw on visitors;
drop policy if exists visitors_resident on visitors;
drop policy if exists visitors_resident_insert on visitors;
drop policy if exists visitors_guard_admin_update on visitors;

-- ============================================================
-- 3. Strict app_users policies
-- ============================================================

-- Users can only update their own row and CANNOT modify their role or society_id
create policy app_users_self_update on app_users for update
  to authenticated
  using (email = (select email from auth.users where id = auth.uid()))
  with check (
    email = (select email from auth.users where id = auth.uid())
    and role = (select role from app_users where id = (current_app_user()).id)
    and society_id = (select society_id from app_users where id = (current_app_user()).id)
  );

-- Admins can manage users within their own society
create policy app_users_admin_write on app_users for all
  to authenticated
  using (
    (current_app_user()).role = 'admin' 
    and society_id = (current_app_user()).society_id
  )
  with check (
    (current_app_user()).role = 'admin' 
    and society_id = (current_app_user()).society_id
  );

-- ============================================================
-- 4. Flats: Only admin can write to flats within their own society
-- ============================================================
create policy flats_write on flats for all
  to authenticated
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

-- ============================================================
-- 5. Bills: Admins manage bills for their flats
-- ============================================================
create policy bills_admin_write on bills for all
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

-- ============================================================
-- 6. Expenses: Admins manage expenses for their society
-- ============================================================
create policy expenses_admin_write on expenses for all
  to authenticated
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

-- ============================================================
-- 7. Notices: Admins manage notices for their society
-- ============================================================
create policy notices_admin_write on notices for all
  to authenticated
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

-- ============================================================
-- 8. Contacts: Admins manage contacts for their society
-- ============================================================
create policy contacts_admin_write on contacts for all
  to authenticated
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

-- ============================================================
-- 9. Facilities: Admins manage facilities for their society
-- ============================================================
create policy facilities_admin_write on facilities for all
  to authenticated
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

-- ============================================================
-- 10. Bookings: Residents can request for their flat; Admins manage
-- ============================================================
create policy bookings_resident_write on bookings for insert
  to authenticated
  with check (
    flat_id = (current_app_user()).flat_id
    and facility_id in (select id from facilities where society_id = (current_app_user()).society_id)
  );

create policy bookings_admin_manage on bookings for update
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

-- ============================================================
-- 11. Complaints: Residents create for their flat; Admins resolve
-- ============================================================
create policy complaints_resident_insert on complaints for insert
  to authenticated
  with check (
    flat_id = (current_app_user()).flat_id
  );

create policy complaints_admin_manage on complaints for update
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

-- ============================================================
-- 12. Visitors: Residents create for their flat; Guards/Admins update status
-- ============================================================
create policy visitors_resident_insert on visitors for insert
  to authenticated
  with check (
    flat_id = (current_app_user()).flat_id
  );

create policy visitors_guard_admin_update on visitors for update
  to authenticated
  using (
    (current_app_user()).role in ('admin', 'guard')
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    (current_app_user()).role in ('admin', 'guard')
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );
