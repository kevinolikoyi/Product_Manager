with
    inserted_workspace as (
        insert into
            public.workspaces (name, slug)
        values ('AS WORLD TECH', 'as-world-tech') on conflict (slug) do
        update
        set
            name = excluded.name returning id
    ),
    administrative_secretariat_department as (
        insert into
            public.departments (workspace_id, name, slug)
        select inserted_workspace.id, 'Secretariat Administratif', 'secretariat-administratif'
        from inserted_workspace on conflict (workspace_id, slug) do
        update
        set
            name = excluded.name returning id,
            workspace_id
    ),
    maintenance_department as (
        insert into
            public.departments (workspace_id, name, slug)
        select inserted_workspace.id, 'Maintenance et Reparation', 'technique-maintenance-reparation'
        from inserted_workspace on conflict (workspace_id, slug) do
        update
        set
            name = excluded.name returning id,
            workspace_id
    ),
    software_design_department as (
        insert into
            public.departments (workspace_id, name, slug)
        select inserted_workspace.id, 'Conception logicielle et Design', 'technique-conception-logicielle-design'
        from inserted_workspace on conflict (workspace_id, slug) do
        update
        set
            name = excluded.name returning id,
            workspace_id
    ),
    procurement_department as (
        insert into
            public.departments (workspace_id, name, slug)
        select inserted_workspace.id, 'Service achat, stock / controle', 'service-achat-stock-controle'
        from inserted_workspace on conflict (workspace_id, slug) do
        update
        set
            name = excluded.name returning id,
            workspace_id
    ),
    inserted_manager as (
        insert into
            public.collaborators (
                workspace_id,
                department_id,
                full_name,
                email,
                role
            )
        select inserted_workspace.id, software_design_department.id, 'Manager AS WORLD TECH', 'manager@asworldtech.com', 'manager'
        from
            inserted_workspace
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id on conflict do nothing
        returning id,
            workspace_id
    ),
    resolved_manager as (
        select id, workspace_id
        from inserted_manager
        union all
        select c.id, c.workspace_id
        from public.collaborators c
        join inserted_workspace on inserted_workspace.id = c.workspace_id
        where c.email = 'manager@asworldtech.com'
        limit 1
    ),
    inserted_member as (
        insert into
            public.collaborators (
                workspace_id,
                department_id,
                full_name,
                email,
                role
            )
        select inserted_workspace.id, software_design_department.id, 'Collaborateur AS WORLD TECH', 'member@asworldtech.com', 'member'
        from
            inserted_workspace
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id on conflict do nothing
        returning id,
            workspace_id
    ),
    resolved_member as (
        select id, workspace_id
        from inserted_member
        union all
        select c.id, c.workspace_id
        from public.collaborators c
        join inserted_workspace on inserted_workspace.id = c.workspace_id
        where c.email = 'member@asworldtech.com'
        limit 1
    ),
    software_design_project as (
        insert into
            public.projects (
                workspace_id,
                department_id,
                name,
                description,
                status,
                progress,
                created_by
            )
        select inserted_workspace.id, software_design_department.id, 'Plateforme de gestion centralisee', 'Conception logicielle, interfaces et parcours de pilotage', 'active', 41, resolved_manager.id
        from
            inserted_workspace
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id
            left join resolved_manager on resolved_manager.workspace_id = inserted_workspace.id on conflict (workspace_id, name) do
        update
        set
            description = excluded.description,
            status = excluded.status,
            progress = excluded.progress,
            created_by = excluded.created_by returning id,
            workspace_id
    )
insert into
    public.tasks (
        workspace_id,
        project_id,
        title,
        description,
        status,
        priority,
        risk,
        assignee_id,
        assigned_by,
        due_date,
        position,
        created_by
    )
select software_design_project.workspace_id, software_design_project.id, 'Structurer le referentiel des departements dans l application', 'Synchronisation des services, des vues et du modele de donnees Supabase', 'in_progress', 'high', 'high', resolved_member.id, resolved_manager.id, current_date + 5, 1000, resolved_manager.id
from
    software_design_project
    join inserted_workspace on inserted_workspace.id = software_design_project.workspace_id
    left join resolved_manager on resolved_manager.workspace_id = inserted_workspace.id
    left join resolved_member on resolved_member.workspace_id = inserted_workspace.id
where
    not exists (
        select 1
        from public.tasks t
        where
            t.project_id = software_design_project.id
            and t.title = 'Structurer le referentiel des departements dans l application'
    );
