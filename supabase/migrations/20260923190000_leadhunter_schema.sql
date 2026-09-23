-- LeadHunter tables, isolated inside the shared Q7 Pipeline project.
-- profiles/user_roles/etc already exist in this project and are left untouched.

create table public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_search_id uuid references public.searches(id) on delete set null,
  search_type text not null default 'google_maps',
  niche text,
  location text,
  max_results integer not null default 50,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'running',
  apify_run_id text,
  results_count integer not null default 0,
  duplicates_skipped integer not null default 0,
  cost_credits numeric,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  category text,
  address text,
  city text,
  state text,
  country text,
  phone text,
  phone_normalized text,
  website text,
  email text,
  rating numeric,
  reviews_count integer,
  latitude numeric,
  longitude numeric,
  google_url text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  apify_token text,
  apify_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_search_id_idx on public.leads(search_id);
create index leads_user_phone_idx on public.leads(user_id, phone_normalized);
create index searches_user_id_idx on public.searches(user_id);

alter table public.searches enable row level security;
alter table public.leads enable row level security;
alter table public.user_settings enable row level security;

create policy own_searches on public.searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_leads on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_user_settings on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reuses the project's existing update_updated_at_column() trigger function.
create trigger update_searches_updated_at
  before update on public.searches
  for each row execute function public.update_updated_at_column();

create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at_column();
