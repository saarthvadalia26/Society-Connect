-- Society Connect — migration to email-based auth linking
-- Run this AFTER schema.sql.
-- Why: the original schema required every app_users row to FK to auth.users,
-- which means every demo user (residents, guard) would need to be created in
-- the Auth dashboard before we could seed them. By linking on email instead,
-- we can seed the whole society freely and only need real auth accounts for
-- people who actually log in.

-- 1. Drop the FK and PK so app_users.id can be its own UUID
alter table app_users drop constraint if exists app_users_id_fkey;
alter table app_users drop constraint if exists app_users_pkey cascade;
alter table app_users alter column id set default gen_random_uuid();
alter table app_users add primary key (id);
alter table app_users add constraint app_users_email_unique unique (email);

-- Re-add the FKs that CASCADE dropped
alter table flats add constraint flats_owner_user_id_fkey
  foreign key (owner_user_id) references app_users(id) on delete set null;
alter table notices add constraint notices_created_by_fkey
  foreign key (created_by) references app_users(id) on delete set null;

-- 2. Helper function: returns the current auth user's app_users row.
--    SECURITY DEFINER lets it bypass RLS to read auth.users.
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

-- 3. Replace every policy to use current_app_user() instead of joining on id.
drop policy if exists society_read on societies;
drop policy if exists app_users_self on app_users;
drop policy if exists flats_read on flats;
drop policy if exists flats_write on flats;
drop policy if exists bills_read on bills;
drop policy if exists bills_admin_write on bills;
drop policy if exists expenses_admin on expenses;
drop policy if exists notices_read on notices;
drop policy if exists notices_admin_write on notices;
drop policy if exists complaints_resident on complaints;
drop policy if exists contacts_read on contacts;
drop policy if exists contacts_admin_write on contacts;
drop policy if exists facilities_read on facilities;
drop policy if exists facilities_admin_write on facilities;
drop policy if exists bookings_resident on bookings;
drop policy if exists visitors_resident on visitors;

-- All signed-in users see their own society
create policy society_read on societies for select
  using (id = (current_app_user()).society_id);

-- Everyone sees their own row; admins see everyone in their society
create policy app_users_read on app_users for select
  using (
    email = (select email from auth.users where id = auth.uid())
    or society_id = (current_app_user()).society_id
  );
create policy app_users_admin_write on app_users for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy flats_read on flats for select
  using (society_id = (current_app_user()).society_id);
create policy flats_admin_write on flats for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy bills_read on bills for select
  using (flat_id in (select id from flats where society_id = (current_app_user()).society_id));
create policy bills_admin_write on bills for all
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

create policy expenses_read on expenses for select
  using (society_id = (current_app_user()).society_id);
create policy expenses_admin_write on expenses for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy notices_read on notices for select
  using (society_id = (current_app_user()).society_id);
create policy notices_admin_write on notices for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy complaints_rw on complaints for all
  using (
    flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  )
  with check (
    flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

create policy contacts_read on contacts for select
  using (society_id = (current_app_user()).society_id);
create policy contacts_admin_write on contacts for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy facilities_read on facilities for select
  using (society_id = (current_app_user()).society_id);
create policy facilities_admin_write on facilities for all
  using ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id)
  with check ((current_app_user()).role = 'admin' and society_id = (current_app_user()).society_id);

create policy bookings_rw on bookings for all
  using (flat_id in (select id from flats where society_id = (current_app_user()).society_id))
  with check (flat_id in (select id from flats where society_id = (current_app_user()).society_id));

create policy visitors_rw on visitors for all
  using (flat_id in (select id from flats where society_id = (current_app_user()).society_id))
  with check (flat_id in (select id from flats where society_id = (current_app_user()).society_id));
