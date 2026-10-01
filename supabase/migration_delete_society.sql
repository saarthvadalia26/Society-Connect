-- ============================================================
-- Society Connect — Complete Society Permanent Deletion Migration
-- Run this in your Supabase SQL Editor to support atomic, secure,
-- and permanent deletion of societies and all associated records.
-- ============================================================

-- 1. Admin DELETE policies on bookings, complaints, visitors
drop policy if exists bookings_admin_delete on bookings;
create policy bookings_admin_delete on bookings for delete
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

drop policy if exists complaints_admin_delete on complaints;
create policy complaints_admin_delete on complaints for delete
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

drop policy if exists visitors_admin_delete on visitors;
create policy visitors_admin_delete on visitors for delete
  to authenticated
  using (
    (current_app_user()).role = 'admin'
    and flat_id in (select id from flats where society_id = (current_app_user()).society_id)
  );

-- 2. Atomic, security-definer function for permanent cascade deletion
create or replace function delete_society_completely(target_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  flat_ids uuid[];
  facility_ids uuid[];
begin
  -- Authorization check: caller must be an admin of this society or service role
  if auth.uid() is not null then
    if not exists (
      select 1 from app_users au
      join auth.users u on lower(u.email) = lower(au.email)
      where u.id = auth.uid()
        and au.role = 'admin'
        and au.society_id = target_society_id
    ) then
      raise exception 'Unauthorized: Only an admin of this society can delete it.';
    end if;
  end if;

  -- Collect flat IDs
  select coalesce(array_agg(id), '{}') into flat_ids
  from flats where society_id = target_society_id;

  -- Collect facility IDs
  select coalesce(array_agg(id), '{}') into facility_ids
  from facilities where society_id = target_society_id;

  -- Break circular and foreign key links
  update app_users set flat_id = null where society_id = target_society_id;
  update flats set owner_user_id = null where society_id = target_society_id;
  update notices set created_by = null where society_id = target_society_id;

  -- Delete flat-dependent records
  if array_length(flat_ids, 1) > 0 then
    delete from visitors where flat_id = any(flat_ids);
    delete from complaints where flat_id = any(flat_ids);
    delete from bills where flat_id = any(flat_ids);
    delete from bookings where flat_id = any(flat_ids);
  end if;

  -- Delete facility-dependent bookings
  if array_length(facility_ids, 1) > 0 then
    delete from bookings where facility_id = any(facility_ids);
  end if;

  -- Delete society-scoped records
  delete from expenses where society_id = target_society_id;
  delete from notices where society_id = target_society_id;
  delete from contacts where society_id = target_society_id;
  delete from facilities where society_id = target_society_id;
  delete from flats where society_id = target_society_id;

  -- Delete user profile rows
  delete from app_users where society_id = target_society_id;

  -- Delete the society itself
  delete from societies where id = target_society_id;
end;
$$;

grant execute on function delete_society_completely(uuid) to authenticated, service_role;
