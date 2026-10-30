/*
# Create profiles table for StayNest user accounts

1. Purpose
- Stores user profile data (full name, phone, role) that supplements Supabase's built-in auth.users table.
- Supabase Auth handles email + password hashing + JWT sessions; this table holds the extra fields the StayNest app needs.
- Linked 1:1 to auth.users via the id column (same UUID).

2. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users ON DELETE CASCADE) — same as the auth user's id
  - `full_name` (text, not null) — user's display name
  - `phone` (text, not null) — 10-digit Indian mobile number
  - `role` (text, not null, default 'Tenant') — 'Tenant' or 'Property Owner'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

3. Security
- RLS enabled on profiles.
- Grant SELECT, UPDATE to authenticated (users read/update their own profile).
- The service role (used by the server-side auth API) bypasses RLS and is granted all CRUD.
- INSERT is handled server-side via the service role key, so no anon/authenticated INSERT grant needed.
- Policies: users can SELECT and UPDATE their own profile row (auth.uid() = id).
- A trigger auto-updates updated_at on row update.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'Tenant' CHECK (role IN ('Tenant', 'Property Owner')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO service_role;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();