-- Society Connect — demo seed
-- Run this AFTER schema.sql AND migration_email_link.sql.
-- Idempotent: re-running is safe.

-- Society
insert into societies (id, name, address)
values ('00000000-0000-0000-0000-000000000001', 'Greenwood Heights', 'Sector 21, Pune, MH 411014')
on conflict (id) do nothing;

-- Admin app_users row — matches the email of the auth user you created.
-- Adjust the email if you used a different one.
insert into app_users (id, email, name, role, society_id, flat_id)
values (
  '00000000-0000-0000-0000-000000000010',
  'admin@greenwood.in',
  'Priya Mehta (Secretary)',
  'admin',
  '00000000-0000-0000-0000-000000000001',
  null
)
on conflict (email) do update set id = excluded.id, role = excluded.role, society_id = excluded.society_id;

-- Guard
insert into app_users (id, email, name, role, society_id, flat_id)
values (
  '00000000-0000-0000-0000-000000000011',
  'guard@greenwood.in',
  'Ramesh (Main Gate)',
  'guard',
  '00000000-0000-0000-0000-000000000001',
  null
)
on conflict (email) do nothing;

-- Residents
insert into app_users (id, email, name, role, society_id, flat_id) values
  ('00000000-0000-0000-0000-000000000021', 'rohan@example.com',  'Rohan Sharma',  'resident', '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000022', 'anita@example.com',  'Anita Desai',   'resident', '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000023', 'vikram@example.com', 'Vikram Iyer',   'resident', '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000024', 'sneha@example.com',  'Sneha Kapoor',  'resident', '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000025', 'karan@example.com',  'Karan Patel',   'resident', '00000000-0000-0000-0000-000000000001', null)
on conflict (email) do nothing;

-- Flats
insert into flats (id, society_id, block, number, owner_user_id) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'A', '101', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'A', '102', '00000000-0000-0000-0000-000000000022'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'B', '201', '00000000-0000-0000-0000-000000000023'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'B', '202', '00000000-0000-0000-0000-000000000024'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'C', '301', '00000000-0000-0000-0000-000000000025')
on conflict (society_id, block, number) do nothing;

-- Link residents to their flats
update app_users set flat_id = '00000000-0000-0000-0000-000000000101' where email = 'rohan@example.com';
update app_users set flat_id = '00000000-0000-0000-0000-000000000102' where email = 'anita@example.com';
update app_users set flat_id = '00000000-0000-0000-0000-000000000103' where email = 'vikram@example.com';
update app_users set flat_id = '00000000-0000-0000-0000-000000000104' where email = 'sneha@example.com';
update app_users set flat_id = '00000000-0000-0000-0000-000000000105' where email = 'karan@example.com';

-- Bills: current month unpaid for everyone, prior month paid for non-defaulters,
-- Vikram is a defaulter with 3 extra unpaid months.
do $$
declare
  cur_period text := to_char(current_date, 'YYYY-MM');
  prev_period text := to_char(current_date - interval '1 month', 'YYYY-MM');
  m2 text := to_char(current_date - interval '2 month', 'YYYY-MM');
  m3 text := to_char(current_date - interval '3 month', 'YYYY-MM');
begin
  -- Current month: every flat unpaid
  insert into bills (flat_id, period, amount, status, due_date)
  select id, cur_period, 3000, 'unpaid', (cur_period || '-15')::date
  from flats where society_id = '00000000-0000-0000-0000-000000000001'
  on conflict (flat_id, period) do nothing;

  -- Last month: all but Vikram have paid
  insert into bills (flat_id, period, amount, status, due_date, paid_at, serial_no)
  select id, prev_period, 3000, 'paid', (prev_period || '-15')::date, now() - interval '15 days',
         'RCPT-' || (1000 + row_number() over ())
  from flats
  where society_id = '00000000-0000-0000-0000-000000000001'
    and id <> '00000000-0000-0000-0000-000000000103'
  on conflict (flat_id, period) do nothing;

  -- Vikram: 3 extra unpaid months
  insert into bills (flat_id, period, amount, status, due_date)
  values
    ('00000000-0000-0000-0000-000000000103', prev_period, 3000, 'unpaid', (prev_period || '-15')::date),
    ('00000000-0000-0000-0000-000000000103', m2, 3000, 'unpaid', (m2 || '-15')::date),
    ('00000000-0000-0000-0000-000000000103', m3, 3000, 'unpaid', (m3 || '-15')::date)
  on conflict (flat_id, period) do nothing;
end $$;

-- Expenses
insert into expenses (society_id, category, vendor, amount, note, spent_on) values
  ('00000000-0000-0000-0000-000000000001', 'Utilities', 'City Water Tankers', 5000, 'Two tankers, summer top-up', current_date - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001', 'Maintenance', 'Lift Tech Pvt Ltd', 8500, 'Quarterly elevator service', current_date - interval '3 days');

-- Notices
insert into notices (society_id, title, body, created_by) values
  ('00000000-0000-0000-0000-000000000001', 'Holi celebration on the 8th', 'Common area will be reserved from 10am. Please move two-wheelers from Block A driveway.', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000001', 'Water tanker schedule revised', 'Tankers will now arrive on Mon/Thu mornings until further notice.', '00000000-0000-0000-0000-000000000010');

-- Sample complaints
insert into complaints (flat_id, category, description, status) values
  ('00000000-0000-0000-0000-000000000102', 'Plumbing', 'Kitchen sink drain is blocked.', 'open'),
  ('00000000-0000-0000-0000-000000000104', 'Electrical', 'Corridor light on 2nd floor is flickering.', 'open');

-- Contacts
insert into contacts (society_id, name, role, phone, rating, notes) values
  ('00000000-0000-0000-0000-000000000001', 'Suresh Kumar',          'Plumber',     '+919812345601', 5, 'Available 24x7 for emergencies.'),
  ('00000000-0000-0000-0000-000000000001', 'Mahesh Electric Works', 'Electrician', '+919812345602', 4, 'Closed on Sundays.'),
  ('00000000-0000-0000-0000-000000000001', 'Ganesh Carpentry',      'Carpenter',   '+919812345603', 4, null);

-- Facilities
insert into facilities (id, society_id, name, fee, description) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'Clubhouse', 2500, 'Air-conditioned hall, capacity 60.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'Swimming Pool (private slot)', 1500, '2-hour exclusive booking.')
on conflict (id) do nothing;
