with target_workspace as (
  select id
  from public.workspaces
  where slug = 'as-world-tech'
)
insert into public.departments (workspace_id, name, slug)
select
  target_workspace.id,
  department.name,
  department.slug
from target_workspace
cross join (
  values
    ('Secretariat Administratif', 'secretariat-administratif'),
    ('Maintenance et Reparation', 'technique-maintenance-reparation'),
    ('Conception logicielle et Design', 'technique-conception-logicielle-design'),
    ('Service achat, stock / controle', 'service-achat-stock-controle')
) as department(name, slug)
on conflict (workspace_id, slug) do update
set name = excluded.name;
