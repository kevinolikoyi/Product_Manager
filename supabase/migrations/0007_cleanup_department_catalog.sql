with target_workspace as (
  select id
  from public.workspaces
  where slug = 'as-world-tech'
),
canonical_departments as (
  select
    (
      select d.id
      from public.departments d
      where d.workspace_id = (select id from target_workspace)
        and d.slug = 'technique-conception-logicielle-design'
      order by d.created_at desc, d.id desc
      limit 1
    ) as fallback_department_id,
    (
      select d.id
      from public.departments d
      where d.workspace_id = (select id from target_workspace)
        and d.slug = 'service-achat-stock-controle'
      order by d.created_at desc, d.id desc
      limit 1
    ) as procurement_department_id
),
departments_to_reassign as (
  select
    d.id as source_department_id,
    case
      when d.slug in ('direction-operations', 'engineering', 'product')
        then canonical_departments.fallback_department_id
      when d.slug <> 'service-achat-stock-controle'
        and d.slug like 'service-achat-stock-contr_le'
        then canonical_departments.procurement_department_id
      else null
    end as target_department_id
  from public.departments d
  cross join canonical_departments
  where d.workspace_id = (select id from target_workspace)
    and (
      d.slug in ('direction-operations', 'engineering', 'product')
      or (
        d.slug <> 'service-achat-stock-controle'
        and d.slug like 'service-achat-stock-contr_le'
      )
    )
),
updated_workspace_members as (
  update public.workspace_members wm
  set department_id = reassignment.target_department_id
  from departments_to_reassign reassignment
  where wm.department_id = reassignment.source_department_id
    and reassignment.target_department_id is not null
),
updated_projects as (
  update public.projects p
  set department_id = reassignment.target_department_id
  from departments_to_reassign reassignment
  where p.department_id = reassignment.source_department_id
    and reassignment.target_department_id is not null
),
updated_financial_entries as (
  update public.financial_entries fe
  set department_id = reassignment.target_department_id
  from departments_to_reassign reassignment
  where fe.department_id = reassignment.source_department_id
    and reassignment.target_department_id is not null
)
delete from public.departments d
using departments_to_reassign reassignment
where d.id = reassignment.source_department_id
  and (
    reassignment.target_department_id is not null
    or (
      not exists (
        select 1
        from public.projects p
        where p.department_id = reassignment.source_department_id
      )
      and not exists (
        select 1
        from public.workspace_members wm
        where wm.department_id = reassignment.source_department_id
      )
      and not exists (
        select 1
        from public.financial_entries fe
        where fe.department_id = reassignment.source_department_id
      )
    )
  );
