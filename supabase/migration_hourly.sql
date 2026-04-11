-- Migration to add hourly booking fields to the bookings table.
-- Please run this script in your Supabase SQL Editor.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS start_time TEXT NOT NULL DEFAULT '00:00',
ADD COLUMN IF NOT EXISTS end_time TEXT NOT NULL DEFAULT '23:59';

-- We use TEXT for these columns in the format 'HH:MM'. This perfectly evaluates logically
-- via Supabase when finding overlaps: e.g. '08:00' < '10:00' evaluates correctly as text.

-- Option: You can strip the default values after successful migration if preferred.
