create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_start date not null,
  revenue integer not null default 0 check (revenue >= 0),
  expenses integer not null default 0 check (expenses >= 0),
  profit integer not null check (profit = revenue - expenses),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, period_start),
  check (period_start = date_trunc('month', period_start)::date)
);

create index if not exists idx_financial_entries_workspace_period
  on public.financial_entries(workspace_id, period_start desc);

drop trigger if exists trg_financial_entries_set_updated_at on public.financial_entries;
create trigger trg_financial_entries_set_updated_at
before update on public.financial_entries
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.financial_entries to authenticated;
grant select, insert, update, delete on public.financial_entries to anon;

alter table public.financial_entries enable row level security;

drop policy if exists "financial_entries_select_member" on public.financial_entries;
create policy "financial_entries_select_member"
on public.financial_entries
for select
using (app.is_workspace_member(workspace_id));

drop policy if exists "financial_entries_insert_owner_manager" on public.financial_entries;
create policy "financial_entries_insert_owner_manager"
on public.financial_entries
for insert
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

drop policy if exists "financial_entries_update_owner_manager" on public.financial_entries;
create policy "financial_entries_update_owner_manager"
on public.financial_entries
for update
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
)
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

drop policy if exists "financial_entries_delete_owner_manager" on public.financial_entries;
create policy "financial_entries_delete_owner_manager"
on public.financial_entries
for delete
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

drop policy if exists "financial_entries_select_anon" on public.financial_entries;
create policy "financial_entries_select_anon"
on public.financial_entries
for select
to anon
using (true);

drop policy if exists "financial_entries_insert_anon" on public.financial_entries;
create policy "financial_entries_insert_anon"
on public.financial_entries
for insert
to anon
with check (true);

drop policy if exists "financial_entries_update_anon" on public.financial_entries;
create policy "financial_entries_update_anon"
on public.financial_entries
for update
to anon
using (true)
with check (true);

drop policy if exists "financial_entries_delete_anon" on public.financial_entries;
create policy "financial_entries_delete_anon"
on public.financial_entries
for delete
to anon
using (true);
