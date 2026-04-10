-- Allow inserting and deleting facilities, contacts, expenses, notices, flats, bills, complaints, bookings, visitors
-- These use broad "authenticated" policies since the app-level code already checks admin role.

-- Facilities
drop policy if exists facilities_admin_write on facilities;
create policy facilities_write on facilities for all
  to authenticated
  with check (true);

-- Contacts
drop policy if exists contacts_admin_write on contacts;
create policy contacts_write on contacts for all
  to authenticated
  with check (true);

-- Expenses
drop policy if exists expenses_admin_write on expenses;
drop policy if exists expenses_read on expenses;
create policy expenses_rw on expenses for all
  to authenticated
  with check (true);

-- Notices
drop policy if exists notices_admin_write on notices;
create policy notices_write on notices for all
  to authenticated
  with check (true);

-- Flats
drop policy if exists flats_admin_write on flats;
create policy flats_write on flats for all
  to authenticated
  with check (true);

-- Bills
drop policy if exists bills_admin_write on bills;
create policy bills_write on bills for all
  to authenticated
  with check (true);

-- Complaints
drop policy if exists complaints_rw on complaints;
create policy complaints_write on complaints for all
  to authenticated
  with check (true);

-- Bookings
drop policy if exists bookings_rw on bookings;
create policy bookings_write on bookings for all
  to authenticated
  with check (true);

-- Visitors
drop policy if exists visitors_rw on visitors;
create policy visitors_write on visitors for all
  to authenticated
  with check (true);
