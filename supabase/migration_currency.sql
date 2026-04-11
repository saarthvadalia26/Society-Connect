-- Migration to add currency reference setting dynamically on society creation.
-- Please run this script in your Supabase SQL Editor.

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';
