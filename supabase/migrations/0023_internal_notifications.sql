create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  workspace_id integer not null references public.workspaces(id) on delete cascade,
  recipient_id integer not null references public.collaborators(id) on delete cascade,
  actor_id integer references public.collaborators(id) on delete set null,
  task_id integer references public.tasks(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_created
  on public.notifications(recipient_id, created_at desc);

create index if not exists idx_notifications_workspace_recipient
  on public.notifications(workspace_id, recipient_id);

alter table public.notifications enable row level security;

grant select, insert, update, delete on public.notifications to authenticated;
grant usage, select on sequence public.notifications_id_seq to authenticated;

drop policy if exists "notifications_select_visible" on public.notifications;
drop policy if exists "notifications_insert_manager" on public.notifications;
drop policy if exists "notifications_update_recipient" on public.notifications;
drop policy if exists "notifications_delete_visible" on public.notifications;

create policy "notifications_select_visible"
on public.notifications
for select
to authenticated
using (
  recipient_id = app.current_collaborator_id(workspace_id)
  or app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);

create policy "notifications_insert_manager"
on public.notifications
for insert
to authenticated
with check (
  actor_id = app.current_collaborator_id(workspace_id)
  and app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
  and exists (
    select 1
    from public.collaborators as collaborators
    where collaborators.id = recipient_id
      and collaborators.workspace_id = notifications.workspace_id
  )
);

create policy "notifications_update_recipient"
on public.notifications
for update
to authenticated
using (recipient_id = app.current_collaborator_id(workspace_id))
with check (recipient_id = app.current_collaborator_id(workspace_id));

create policy "notifications_delete_visible"
on public.notifications
for delete
to authenticated
using (
  recipient_id = app.current_collaborator_id(workspace_id)
  or app.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[])
);
