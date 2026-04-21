create unique index if not exists idx_departments_workspace_id_id
  on public.departments(workspace_id, id);

create unique index if not exists idx_projects_workspace_id_id
  on public.projects(workspace_id, id);

alter table public.workspace_members
  drop constraint if exists workspace_members_workspace_department_fk;

alter table public.workspace_members
  add constraint workspace_members_workspace_department_fk
  foreign key (workspace_id, department_id)
  references public.departments(workspace_id, id)
  on delete set null;

alter table public.projects
  drop constraint if exists projects_workspace_department_fk;

alter table public.projects
  add constraint projects_workspace_department_fk
  foreign key (workspace_id, department_id)
  references public.departments(workspace_id, id)
  on delete restrict;

alter table public.tasks
  drop constraint if exists tasks_workspace_project_fk;

alter table public.tasks
  add constraint tasks_workspace_project_fk
  foreign key (workspace_id, project_id)
  references public.projects(workspace_id, id)
  on delete cascade;

alter table public.financial_entries
  add column if not exists department_id uuid;

alter table public.financial_entries
  drop constraint if exists financial_entries_workspace_department_fk;

alter table public.financial_entries
  add constraint financial_entries_workspace_department_fk
  foreign key (workspace_id, department_id)
  references public.departments(workspace_id, id)
  on delete set null;

alter table public.financial_entries
  drop constraint if exists financial_entries_workspace_id_period_start_key;

drop index if exists idx_financial_entries_workspace_period;

create index if not exists idx_financial_entries_workspace_period
  on public.financial_entries(workspace_id, period_start desc)
  where department_id is null;

create index if not exists idx_financial_entries_workspace_department_period
  on public.financial_entries(workspace_id, department_id, period_start desc)
  where department_id is not null;

create unique index if not exists uq_financial_entries_workspace_period_global
  on public.financial_entries(workspace_id, period_start)
  where department_id is null;

create unique index if not exists uq_financial_entries_workspace_department_period
  on public.financial_entries(workspace_id, department_id, period_start)
  where department_id is not null;

drop policy if exists "financial_entries_select_member" on public.financial_entries;
create policy "financial_entries_select_member"
on public.financial_entries
for select
using (
  app.is_workspace_member(workspace_id)
  and (
    department_id is null
    or app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
    or department_id = app.current_department_id(workspace_id)
  )
);

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
using (department_id is null);

drop policy if exists "financial_entries_insert_anon" on public.financial_entries;
create policy "financial_entries_insert_anon"
on public.financial_entries
for insert
to anon
with check (department_id is null);

drop policy if exists "financial_entries_update_anon" on public.financial_entries;
create policy "financial_entries_update_anon"
on public.financial_entries
for update
to anon
using (department_id is null)
with check (department_id is null);

drop policy if exists "financial_entries_delete_anon" on public.financial_entries;
create policy "financial_entries_delete_anon"
on public.financial_entries
for delete
to anon
using (department_id is null);
