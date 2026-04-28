alter table public.collaborators
add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_collaborators_auth_user_id
  on public.collaborators(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_collaborators_workspace_auth_user
  on public.collaborators(workspace_id, auth_user_id)
  where auth_user_id is not null;

update public.collaborators as collaborators
set auth_user_id = auth_users.id
from auth.users as auth_users
where collaborators.auth_user_id is null
  and collaborators.email is not null
  and lower(trim(collaborators.email)) = lower(trim(auth_users.email));

revoke select, insert, update, delete on
  public.workspaces,
  public.departments,
  public.collaborators,
  public.projects,
  public.tasks,
  public.task_comments,
  public.financial_entries
from anon;

revoke usage, select on all sequences in schema public from anon;

grant usage on schema app to authenticated;

create table if not exists app.workspace_access (
  collaborator_id integer primary key references public.collaborators(id) on delete cascade,
  workspace_id integer not null references public.workspaces(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  department_id integer references public.departments(id) on delete set null,
  role public.workspace_role not null
);

create unique index if not exists idx_workspace_access_workspace_auth_user
  on app.workspace_access(workspace_id, auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_workspace_access_auth_user
  on app.workspace_access(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_workspace_access_workspace_role
  on app.workspace_access(workspace_id, role);

create or replace function app.sync_workspace_access_from_collaborator()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if tg_op = 'DELETE' then
    delete from app.workspace_access
    where collaborator_id = old.id;

    return old;
  end if;

  insert into app.workspace_access (
    collaborator_id,
    workspace_id,
    auth_user_id,
    department_id,
    role
  )
  values (
    new.id,
    new.workspace_id,
    new.auth_user_id,
    new.department_id,
    new.role
  )
  on conflict (collaborator_id) do update
  set workspace_id = excluded.workspace_id,
      auth_user_id = excluded.auth_user_id,
      department_id = excluded.department_id,
      role = excluded.role;

  return new;
end;
$$;

insert into app.workspace_access (
  collaborator_id,
  workspace_id,
  auth_user_id,
  department_id,
  role
)
select
  collaborators.id,
  collaborators.workspace_id,
  collaborators.auth_user_id,
  collaborators.department_id,
  collaborators.role
from public.collaborators as collaborators
on conflict (collaborator_id) do update
set workspace_id = excluded.workspace_id,
    auth_user_id = excluded.auth_user_id,
    department_id = excluded.department_id,
    role = excluded.role;

drop trigger if exists trg_sync_workspace_access_from_collaborator on public.collaborators;
create trigger trg_sync_workspace_access_from_collaborator
after insert or update of workspace_id, auth_user_id, department_id, role
on public.collaborators
for each row execute function app.sync_workspace_access_from_collaborator();

drop trigger if exists trg_delete_workspace_access_from_collaborator on public.collaborators;
create trigger trg_delete_workspace_access_from_collaborator
after delete on public.collaborators
for each row execute function app.sync_workspace_access_from_collaborator();

create or replace function app.current_collaborator_id(p_workspace_id integer)
returns integer
language sql
stable
security definer
set search_path = app, public
as $$
  select workspace_access.collaborator_id
  from app.workspace_access as workspace_access
  where workspace_access.workspace_id = p_workspace_id
    and workspace_access.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function app.is_workspace_collaborator(p_workspace_id integer)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
  );
$$;

create or replace function app.has_workspace_role(
  p_workspace_id integer,
  p_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
      and workspace_access.role = any(p_roles)
  );
$$;

create or replace function app.can_read_project(
  p_workspace_id integer,
  p_project_id integer
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
      and (
        workspace_access.role in ('owner', 'manager')
        or exists (
          select 1
          from public.tasks as tasks
          where tasks.project_id = p_project_id
            and (
              tasks.assignee_id = workspace_access.collaborator_id
              or tasks.created_by = workspace_access.collaborator_id
            )
        )
      )
  );
$$;

create or replace function app.can_read_task(
  p_workspace_id integer,
  p_task_id integer
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    join public.tasks as tasks on tasks.id = p_task_id
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
      and tasks.workspace_id = p_workspace_id
      and (
        workspace_access.role in ('owner', 'manager')
        or tasks.assignee_id = workspace_access.collaborator_id
        or tasks.created_by = workspace_access.collaborator_id
      )
  );
$$;

create or replace function app.can_insert_task(
  p_workspace_id integer,
  p_project_id integer
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    join public.projects as projects on projects.id = p_project_id
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
      and projects.workspace_id = p_workspace_id
      and (
        workspace_access.role in ('owner', 'manager')
        or exists (
          select 1
          from public.tasks as tasks
          where tasks.project_id = p_project_id
            and (
              tasks.assignee_id = workspace_access.collaborator_id
              or tasks.created_by = workspace_access.collaborator_id
            )
        )
      )
  );
$$;

create or replace function app.can_update_task(
  p_workspace_id integer,
  p_project_id integer,
  p_created_by integer,
  p_assignee_id integer
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.workspace_access as workspace_access
    join public.projects as projects on projects.id = p_project_id
    where workspace_access.workspace_id = p_workspace_id
      and workspace_access.auth_user_id = auth.uid()
      and projects.workspace_id = p_workspace_id
      and (
        workspace_access.role in ('owner', 'manager')
        or p_created_by = workspace_access.collaborator_id
        or p_assignee_id = workspace_access.collaborator_id
      )
  );
$$;

create or replace function app.can_manage_task_comment(p_comment_id integer)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from public.task_comments as task_comments
    join public.tasks as tasks on tasks.id = task_comments.task_id
    join app.workspace_access as workspace_access on workspace_access.workspace_id = tasks.workspace_id
    where task_comments.id = p_comment_id
      and workspace_access.auth_user_id = auth.uid()
      and (
        workspace_access.role in ('owner', 'manager')
        or task_comments.author_id = workspace_access.collaborator_id
      )
  );
$$;

grant execute on all functions in schema app to authenticated;

drop policy if exists "workspaces_anon_all" on public.workspaces;
drop policy if exists "departments_anon_all" on public.departments;
drop policy if exists "collaborators_anon_all" on public.collaborators;
drop policy if exists "projects_anon_all" on public.projects;
drop policy if exists "tasks_anon_all" on public.tasks;
drop policy if exists "task_comments_anon_all" on public.task_comments;
drop policy if exists "financial_entries_anon_all" on public.financial_entries;

drop policy if exists "workspaces_authenticated_all" on public.workspaces;
drop policy if exists "departments_authenticated_all" on public.departments;
drop policy if exists "collaborators_authenticated_all" on public.collaborators;
drop policy if exists "projects_authenticated_all" on public.projects;
drop policy if exists "tasks_authenticated_all" on public.tasks;
drop policy if exists "task_comments_authenticated_all" on public.task_comments;
drop policy if exists "financial_entries_authenticated_all" on public.financial_entries;

drop policy if exists "collaborator_read_self" on public.collaborators;
drop policy if exists "collaborator_read_workspace_for_admins" on public.collaborators;
drop policy if exists "collaborators_select_self_or_admin" on public.collaborators;
drop policy if exists "collaborators_manage_admin" on public.collaborators;
drop policy if exists "collaborators_select_self" on public.collaborators;
drop policy if exists "collaborators_select_admin" on public.collaborators;
drop policy if exists "collaborators_insert_admin" on public.collaborators;
drop policy if exists "collaborators_update_admin" on public.collaborators;
drop policy if exists "collaborators_delete_admin" on public.collaborators;

drop policy if exists "projects_select_visible" on public.projects;
drop policy if exists "projects_manage_admin" on public.projects;
drop policy if exists "tasks_select_visible" on public.tasks;
drop policy if exists "tasks_insert_visible" on public.tasks;
drop policy if exists "tasks_update_visible" on public.tasks;
drop policy if exists "tasks_delete_visible" on public.tasks;
drop policy if exists "task_comments_select_visible" on public.task_comments;
drop policy if exists "task_comments_insert_visible" on public.task_comments;
drop policy if exists "task_comments_update_visible" on public.task_comments;
drop policy if exists "task_comments_delete_visible" on public.task_comments;
drop policy if exists "financial_entries_select_admin" on public.financial_entries;
drop policy if exists "financial_entries_manage_admin" on public.financial_entries;
drop policy if exists "workspaces_select_collaborator" on public.workspaces;
drop policy if exists "departments_select_collaborator" on public.departments;

create policy "workspaces_select_collaborator"
on public.workspaces
for select
to authenticated
using (app.is_workspace_collaborator(id));

create policy "departments_select_collaborator"
on public.departments
for select
to authenticated
using (app.is_workspace_collaborator(workspace_id));

create policy "collaborators_select_self"
on public.collaborators
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "collaborators_select_admin"
on public.collaborators
for select
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "collaborators_insert_admin"
on public.collaborators
for insert
to authenticated
with check (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "collaborators_update_admin"
on public.collaborators
for update
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]))
with check (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "collaborators_delete_admin"
on public.collaborators
for delete
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "projects_select_visible"
on public.projects
for select
to authenticated
using (app.can_read_project(workspace_id, id));

create policy "projects_manage_admin"
on public.projects
for all
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]))
with check (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "tasks_select_visible"
on public.tasks
for select
to authenticated
using (app.can_read_task(workspace_id, id));

create policy "tasks_insert_visible"
on public.tasks
for insert
to authenticated
with check (
  created_by = app.current_collaborator_id(workspace_id)
  and app.can_insert_task(workspace_id, project_id)
);

create policy "tasks_update_visible"
on public.tasks
for update
to authenticated
using (app.can_update_task(workspace_id, project_id, created_by, assignee_id))
with check (app.can_update_task(workspace_id, project_id, created_by, assignee_id));

create policy "tasks_delete_visible"
on public.tasks
for delete
to authenticated
using (app.can_update_task(workspace_id, project_id, created_by, assignee_id));

create policy "task_comments_select_visible"
on public.task_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks as tasks
    where tasks.id = task_id
      and app.can_read_task(tasks.workspace_id, tasks.id)
  )
);

create policy "task_comments_insert_visible"
on public.task_comments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks as tasks
    where tasks.id = task_id
      and author_id = app.current_collaborator_id(tasks.workspace_id)
      and app.can_read_task(tasks.workspace_id, tasks.id)
  )
);

create policy "task_comments_update_visible"
on public.task_comments
for update
to authenticated
using (app.can_manage_task_comment(id))
with check (app.can_manage_task_comment(id));

create policy "task_comments_delete_visible"
on public.task_comments
for delete
to authenticated
using (app.can_manage_task_comment(id));

create policy "financial_entries_select_admin"
on public.financial_entries
for select
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "financial_entries_manage_admin"
on public.financial_entries
for all
to authenticated
using (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]))
with check (app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));
