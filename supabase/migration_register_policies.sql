-- Allow any user (including anon during registration) to create a society.
drop policy if exists societies_insert on societies;
create policy societies_insert on societies for insert
  with check (true);

-- Allow any user (including anon during registration) to create an app_users row.
drop policy if exists app_users_insert on app_users;
create policy app_users_insert on app_users for insert
  with check (true);

-- Allow authenticated users to update their own app_users row.
create policy app_users_self_update on app_users for update
  to authenticated
  using (email = (select email from auth.users where id = auth.uid()))
  with check (email = (select email from auth.users where id = auth.uid()));
