-- ============================================================
-- Awais Tech Services Invoicing — Supabase Schema
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/drvmuhejbhdtccqnqqwg/sql/new
-- ============================================================

-- 1. Business profiles (one per user)
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  name          text,
  email         text,
  phone         text,
  address       text,
  abn           text,
  logo          text,
  currency      text default 'AUD',
  invoice_prefix      text default 'INV',
  next_invoice_number integer default 1001,
  theme         text default 'light',
  account_no    text,
  account_name  text,
  bank_name     text,
  terms         text,
  updated_at    timestamptz default now()
);

-- 2. Clients
create table if not exists clients (
  id         text primary key,
  user_id    uuid references auth.users on delete cascade not null,
  name       text,
  company    text,
  email      text,
  phone      text,
  address    text,
  abn        text,
  notes      text,
  created_at timestamptz default now()
);

-- 3. Invoices
create table if not exists invoices (
  id             text primary key,
  user_id        uuid references auth.users on delete cascade not null,
  invoice_number text,
  client_id      text,
  status         text default 'draft',
  invoice_date   text,
  due_date       text,
  line_items     jsonb default '[]',
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────

alter table profiles enable row level security;
alter table clients  enable row level security;
alter table invoices enable row level security;

-- Drop existing policies first (safe to re-run)
drop policy if exists "profiles_all"  on profiles;
drop policy if exists "clients_all"   on clients;
drop policy if exists "invoices_all"  on invoices;

-- Each user can only access their own data
create policy "profiles_all"  on profiles  for all using (auth.uid() = id);
create policy "clients_all"   on clients   for all using (auth.uid() = user_id);
create policy "invoices_all"  on invoices  for all using (auth.uid() = user_id);

-- ── Indexes ─────────────────────────────────────────────────

create index if not exists clients_user_id_idx  on clients  (user_id);
create index if not exists invoices_user_id_idx on invoices (user_id);
create index if not exists invoices_status_idx  on invoices (status);
