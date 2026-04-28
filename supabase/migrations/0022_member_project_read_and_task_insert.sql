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
  );
$$;
