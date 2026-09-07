-- Society Connect — full schema
-- Paste this into the Supabase SQL editor and run it once.
-- Project: lavczlplvzuappuoirca

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists societies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text not null,
  currency text not null default 'INR',
  logo_url text
);

-- We map users by Supabase auth.users.id (uuid). The `role` column drives
-- which portal a user lands on after signing in.
create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'resident', 'guard')),
  society_id uuid not null references societies(id) on delete cascade,
  flat_id uuid
);
create index if not exists app_users_society_idx on app_users(society_id);

create table if not exists flats (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  block text not null,
  number text not null,
  owner_user_id uuid references app_users(id) on delete set null,
  unique (society_id, block, number)
);
create index if not exists flats_society_idx on flats(society_id);

alter table app_users drop constraint if exists app_users_flat_fk;
alter table app_users
  add constraint app_users_flat_fk foreign key (flat_id) references flats(id) on delete set null;

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  period text not null,                   -- YYYY-MM
  amount integer not null,
  status text not null check (status in ('unpaid', 'paid')),
  due_date date not null,
  paid_at timestamptz,
  serial_no text,
  line_items jsonb,
  unique (flat_id, period)
);
create index if not exists bills_flat_idx on bills(flat_id);
create index if not exists bills_period_idx on bills(period);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  category text not null,
  vendor text not null,
  amount integer not null,
  note text,
  spent_on date not null
);
create index if not exists expenses_society_idx on expenses(society_id);

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists notices_society_idx on notices(society_id);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  category text not null,
  description text not null,
  status text not null check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  photo_url text                              -- Supabase Storage URL
);
create index if not exists complaints_flat_idx on complaints(flat_id);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  role text not null,
  phone text not null,
  rating int not null check (rating between 1 and 5),
  notes text
);
create index if not exists contacts_society_idx on contacts(society_id);

create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  fee integer not null,
  description text
);
create index if not exists facilities_society_idx on facilities(society_id);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  flat_id uuid not null references flats(id) on delete cascade,
  date date not null,
  start_time text not null default '00:00',   -- HH:MM
  end_time text not null default '23:59',     -- HH:MM
  status text not null check (status in ('requested', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  fee_billed boolean not null default false
);
create index if not exists bookings_facility_date_idx on bookings(facility_id, date);
create index if not exists bookings_flat_idx on bookings(flat_id);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  name text not null,
  purpose text not null,
  entry_code text not null unique,
  status text not null check (status in ('pending', 'approved', 'denied', 'entered')),
  created_at timestamptz not null default now(),
  expected_on date not null,
  entered_at timestamptz
);
create index if not exists visitors_code_idx on visitors(entry_code);

-- ============================================================
-- Row Level Security
-- All tables on; the publishable key respects these policies.
-- Helper: current user's app row.
-- ============================================================

create or replace view me as
select * from app_users where id = auth.uid();

alter table app_users  enable row level security;
alter table societies  enable row level security;
alter table flats      enable row level security;
alter table bills      enable row level security;
alter table expenses   enable row level security;
alter table notices    enable row level security;
alter table complaints enable row level security;
alter table contacts   enable row level security;
alter table facilities enable row level security;
alter table bookings   enable row level security;
alter table visitors   enable row level security;

-- Anyone signed in can see society info (their own society only).
drop policy if exists society_read on societies;
create policy society_read on societies for select
  using (id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

-- Allow society creation during registration.
drop policy if exists societies_insert on societies;
create policy societies_insert on societies for insert
  with check (true);

-- Users see their own row. Admins see everyone in their society.
drop policy if exists app_users_self on app_users;
create policy app_users_self on app_users for select
  using (
    id = auth.uid()
    or lower(email) = lower(auth.jwt() ->> 'email')
    or society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
  );

-- Allow user profile creation during registration.
drop policy if exists app_users_insert on app_users;
create policy app_users_insert on app_users for insert
  with check (true);

-- Allow authenticated users to update their own app_users row.
drop policy if exists app_users_self_update on app_users;
create policy app_users_self_update on app_users for update
  to authenticated
  using (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
  with check (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));

-- Helper macro: same-society check inlined per table.
drop policy if exists flats_read on flats;
create policy flats_read on flats for select
  using (society_id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

drop policy if exists flats_write on flats;
create policy flats_write on flats for all
  using (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'))
  with check (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'));

drop policy if exists bills_read on bills;
create policy bills_read on bills for select
  using (
    flat_id in (
      select id from flats
      where society_id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists bills_admin_write on bills;
create policy bills_admin_write on bills for all
  using (
    flat_id in (
      select id from flats
      where society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  )
  with check (
    flat_id in (
      select id from flats
      where society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  );

drop policy if exists expenses_admin on expenses;
create policy expenses_admin on expenses for all
  using (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'))
  with check (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'));

drop policy if exists notices_read on notices;
create policy notices_read on notices for select
  using (society_id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

drop policy if exists notices_admin_write on notices;
create policy notices_admin_write on notices for all
  using (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'))
  with check (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'));

drop policy if exists complaints_resident on complaints;
create policy complaints_resident on complaints for all
  using (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  )
  with check (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  );

drop policy if exists contacts_read on contacts;
create policy contacts_read on contacts for select
  using (society_id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

drop policy if exists contacts_admin_write on contacts;
create policy contacts_admin_write on contacts for all
  using (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'))
  with check (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'));

drop policy if exists facilities_read on facilities;
create policy facilities_read on facilities for select
  using (society_id in (select society_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

drop policy if exists facilities_admin_write on facilities;
create policy facilities_admin_write on facilities for all
  using (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'))
  with check (society_id in (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin'));

drop policy if exists bookings_resident on bookings;
create policy bookings_resident on bookings for all
  using (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  )
  with check (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role = 'admin')
    )
  );

-- Visitors: residents see/create their own; admins see all in society;
-- guards can read all and update entered status.
drop policy if exists visitors_resident on visitors;
create policy visitors_resident on visitors for all
  using (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role in ('admin', 'guard'))
    )
  )
  with check (
    flat_id in (select flat_id from app_users where id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    or flat_id in (
      select id from flats where society_id in
      (select society_id from app_users where (id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')) and role in ('admin', 'guard'))
    )
  );
