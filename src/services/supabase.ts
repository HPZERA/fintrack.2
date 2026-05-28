// Supabase client — configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
// import { createClient } from '@supabase/supabase-js';
//
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Placeholder until Supabase is connected
export const supabase = null;

/*
-- Supabase SQL Schema (run in Supabase SQL editor)

-- Users profile
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  currency text default 'BRL',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users see own profile" on public.profiles for all using (auth.uid() = id);

-- Categories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text default 'tag',
  color text default '#3b82f6',
  type text check (type in ('income','expense','both')) default 'both',
  created_at timestamptz default now()
);
alter table public.categories enable row level security;
create policy "Users manage own categories" on public.categories for all using (auth.uid() = user_id);

-- Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null,
  type text check (type in ('income','expense')) not null,
  category_id uuid references public.categories,
  date date not null,
  description text,
  payment_method text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "Users manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Goals
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  deadline date,
  icon text,
  color text default '#3b82f6',
  description text,
  created_at timestamptz default now()
);
alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);

-- Bankroll sessions
create table public.bankroll_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  start_balance numeric(12,2) not null,
  end_balance numeric(12,2) not null,
  profit numeric(12,2) generated always as (end_balance - start_balance) stored,
  duration integer,
  notes text,
  created_at timestamptz default now()
);
alter table public.bankroll_sessions enable row level security;
create policy "Users manage own bankroll" on public.bankroll_sessions for all using (auth.uid() = user_id);
*/
