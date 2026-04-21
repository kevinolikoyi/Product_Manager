create extension if not exists pgcrypto;

create schema if not exists app;

create type public.workspace_role as enum ('owner', 'manager', 'member');
create type public.project_status as enum ('active', 'on_hold', 'completed');
create type public.task_status as enum ('todo', 'in_progress', 'done', 'tested', 'deployed');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_risk as enum ('low', 'medium', 'high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  department_id uuid,
  role public.workspace_role not null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  foreign key (department_id) references public.departments(id) on delete set null
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  progress integer not null default 0 check (progress between 0 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  risk public.task_risk not null default 'low',
  assignee_id uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  due_date date,
  position numeric(12, 3) not null default 1000,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  last_commented_at timestamptz
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspace_members_workspace_user
  on public.workspace_members(workspace_id, user_id);
create index idx_workspace_members_user
  on public.workspace_members(user_id);
create index idx_projects_workspace_department
  on public.projects(workspace_id, department_id);
create index idx_tasks_workspace_project
  on public.tasks(workspace_id, project_id);
create index idx_tasks_assignee
  on public.tasks(assignee_id);
create index idx_tasks_status
  on public.tasks(status);
create index idx_task_comments_task_created
  on public.task_comments(task_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.touch_task_from_comment()
returns trigger
language plpgsql
as $$
begin
  update public.tasks
  set last_commented_at = now(),
      updated_at = now()
  where id = new.task_id;

  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger trg_departments_set_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

create trigger trg_workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

create trigger trg_projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger trg_tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger trg_task_comments_set_updated_at
before update on public.task_comments
for each row execute function public.set_updated_at();

create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger trg_handle_new_workspace
after insert on public.workspaces
for each row execute function public.handle_new_workspace();

create trigger trg_touch_task_from_comment
after insert on public.task_comments
for each row execute function public.touch_task_from_comment();

create or replace function app.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function app.current_workspace_role(p_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function app.current_department_id(p_workspace_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select wm.department_id
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function app.has_workspace_role(
  p_workspace_id uuid,
  p_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(p_roles)
  );
$$;

create or replace function app.can_read_project(
  p_workspace_id uuid,
  p_department_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and (
        wm.role in ('owner', 'manager')
        or wm.department_id = p_department_id
      )
  );
$$;

create or replace function app.can_read_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = p_task_id
      and app.can_read_project(p.workspace_id, p.department_id)
  );
$$;

create or replace function app.update_task_status(
  p_task_id uuid,
  p_status public.task_status
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select t.*
  into v_task
  from public.tasks t
  where t.id = p_task_id;

  if not found then
    raise exception 'task not found';
  end if;

  if not app.can_read_task(p_task_id) then
    raise exception 'forbidden';
  end if;

  if app.has_workspace_role(v_task.workspace_id, array['owner', 'manager']::public.workspace_role[])
     or v_task.created_by = auth.uid()
     or v_task.assignee_id = auth.uid() then
    update public.tasks
    set status = p_status,
        status_updated_at = now(),
        updated_at = now()
    where id = p_task_id
    returning * into v_task;

    return v_task;
  end if;

  raise exception 'forbidden';
end;
$$;

create or replace function app.add_task_comment(
  p_task_id uuid,
  p_body text
)
returns public.task_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment public.task_comments;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not app.can_read_task(p_task_id) then
    raise exception 'forbidden';
  end if;

  insert into public.task_comments (task_id, author_id, body)
  values (p_task_id, auth.uid(), trim(p_body))
  returning * into v_comment;

  return v_comment;
end;
$$;

grant usage on schema public to authenticated;
grant usage on schema app to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.workspaces,
  public.departments,
  public.workspace_members,
  public.projects,
  public.tasks,
  public.task_comments
to authenticated;

grant execute on function app.update_task_status(uuid, public.task_status) to authenticated;
grant execute on function app.add_task_comment(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.departments enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;

create policy "profiles_select_same_workspace"
on public.profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members me
    join public.workspace_members other on other.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and other.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "workspaces_select_member"
on public.workspaces
for select
using (app.is_workspace_member(id));

create policy "workspaces_insert_owner"
on public.workspaces
for insert
with check (owner_id = auth.uid());

create policy "workspaces_update_owner"
on public.workspaces
for update
using (app.has_workspace_role(id, array['owner']::public.workspace_role[]))
with check (app.has_workspace_role(id, array['owner']::public.workspace_role[]));

create policy "departments_select_member"
on public.departments
for select
using (app.is_workspace_member(workspace_id));

create policy "departments_insert_owner"
on public.departments
for insert
with check (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "departments_update_owner"
on public.departments
for update
using (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]))
with check (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "departments_delete_owner"
on public.departments
for delete
using (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "workspace_members_select_member"
on public.workspace_members
for select
using (app.is_workspace_member(workspace_id));

create policy "workspace_members_insert_owner"
on public.workspace_members
for insert
with check (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "workspace_members_update_owner"
on public.workspace_members
for update
using (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]))
with check (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "workspace_members_delete_owner"
on public.workspace_members
for delete
using (app.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "projects_select_visible"
on public.projects
for select
using (app.can_read_project(workspace_id, department_id));

create policy "projects_insert_manager_owner"
on public.projects
for insert
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

create policy "projects_update_manager_owner"
on public.projects
for update
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
)
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

create policy "projects_delete_manager_owner"
on public.projects
for delete
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

create policy "tasks_select_visible"
on public.tasks
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.workspace_id = tasks.workspace_id
      and app.can_read_project(p.workspace_id, p.department_id)
  )
);

create policy "tasks_insert_manager_owner_or_member_department"
on public.tasks
for insert
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
  or (
    app.has_workspace_role(workspace_id, array['member']::public.workspace_role[])
    and created_by = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and p.workspace_id = tasks.workspace_id
        and p.department_id = app.current_department_id(tasks.workspace_id)
    )
  )
);

create policy "tasks_update_manager_owner_or_creator"
on public.tasks
for update
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
  or created_by = auth.uid()
)
with check (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
  or created_by = auth.uid()
);

create policy "tasks_delete_manager_owner_or_creator"
on public.tasks
for delete
using (
  app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
  or created_by = auth.uid()
);

create policy "task_comments_select_visible"
on public.task_comments
for select
using (app.can_read_task(task_id));

create policy "task_comments_insert_visible"
on public.task_comments
for insert
with check (
  author_id = auth.uid()
  and app.can_read_task(task_id)
);

create policy "task_comments_update_author_or_manager_owner"
on public.task_comments
for update
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_comments.task_id
      and app.has_workspace_role(t.workspace_id, array['owner', 'manager']::public.workspace_role[])
  )
)
with check (
  author_id = auth.uid()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_comments.task_id
      and app.has_workspace_role(t.workspace_id, array['owner', 'manager']::public.workspace_role[])
  )
);

create policy "task_comments_delete_author_or_manager_owner"
on public.task_comments
for delete
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_comments.task_id
      and app.has_workspace_role(t.workspace_id, array['owner', 'manager']::public.workspace_role[])
  )
);
