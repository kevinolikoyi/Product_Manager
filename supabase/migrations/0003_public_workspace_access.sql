grant usage on schema public to anon;

grant select on
  public.profiles,
  public.workspaces,
  public.departments,
  public.workspace_members
to anon;

grant select, insert, update, delete on
  public.projects,
  public.tasks,
  public.task_comments
to anon;

drop policy if exists "profiles_select_anon" on public.profiles;
create policy "profiles_select_anon"
on public.profiles
for select
to anon
using (true);

drop policy if exists "workspaces_select_anon" on public.workspaces;
create policy "workspaces_select_anon"
on public.workspaces
for select
to anon
using (true);

drop policy if exists "departments_select_anon" on public.departments;
create policy "departments_select_anon"
on public.departments
for select
to anon
using (true);

drop policy if exists "workspace_members_select_anon" on public.workspace_members;
create policy "workspace_members_select_anon"
on public.workspace_members
for select
to anon
using (true);

drop policy if exists "projects_select_anon" on public.projects;
create policy "projects_select_anon"
on public.projects
for select
to anon
using (true);

drop policy if exists "projects_insert_anon" on public.projects;
create policy "projects_insert_anon"
on public.projects
for insert
to anon
with check (true);

drop policy if exists "projects_update_anon" on public.projects;
create policy "projects_update_anon"
on public.projects
for update
to anon
using (true)
with check (true);

drop policy if exists "projects_delete_anon" on public.projects;
create policy "projects_delete_anon"
on public.projects
for delete
to anon
using (true);

drop policy if exists "tasks_select_anon" on public.tasks;
create policy "tasks_select_anon"
on public.tasks
for select
to anon
using (true);

drop policy if exists "tasks_insert_anon" on public.tasks;
create policy "tasks_insert_anon"
on public.tasks
for insert
to anon
with check (true);

drop policy if exists "tasks_update_anon" on public.tasks;
create policy "tasks_update_anon"
on public.tasks
for update
to anon
using (true)
with check (true);

drop policy if exists "tasks_delete_anon" on public.tasks;
create policy "tasks_delete_anon"
on public.tasks
for delete
to anon
using (true);

drop policy if exists "task_comments_select_anon" on public.task_comments;
create policy "task_comments_select_anon"
on public.task_comments
for select
to anon
using (true);

drop policy if exists "task_comments_insert_anon" on public.task_comments;
create policy "task_comments_insert_anon"
on public.task_comments
for insert
to anon
with check (true);

drop policy if exists "task_comments_update_anon" on public.task_comments;
create policy "task_comments_update_anon"
on public.task_comments
for update
to anon
using (true)
with check (true);

drop policy if exists "task_comments_delete_anon" on public.task_comments;
create policy "task_comments_delete_anon"
on public.task_comments
for delete
to anon
using (true);
