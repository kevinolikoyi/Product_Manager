-- Demo seed for AS WORLD TECH.
-- Prerequisite: create these users in Supabase Auth first.
-- owner@asworldtech.com
-- manager@asworldtech.com
-- member@asworldtech.com

with
    owner_user as (
        select id
        from auth.users
        where
            email = 'owner@asworldtech.com'
        limit 1
    ),
    manager_user as (
        select id
        from auth.users
        where
            email = 'manager@asworldtech.com'
        limit 1
    ),
    member_user as (
        select id
        from auth.users
        where
            email = 'member@asworldtech.com'
        limit 1
    ),
    inserted_workspace as (
        insert into
            public.workspaces (name, slug, owner_id)
        select 'AS WORLD TECH', 'as-world-tech', owner_user.id
        from owner_user on conflict (slug) do
        update
        set
            name = excluded.name returning id,
            owner_id
    ),
    operations_department as (
        insert into
            public.departments (workspace_id, name, slug)
        select inserted_workspace.id, 'Direction des operations', 'direction-operations'
        from inserted_workspace on conflict (workspace_id, slug) do
        update
        set
            name = excluded.name returning id,
            workspace_id
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
    upsert_manager as (
        insert into
            public.workspace_members (
                workspace_id,
                user_id,
                department_id,
                role
            )
        select inserted_workspace.id, manager_user.id, software_design_department.id, 'manager'
        from
            inserted_workspace
            join manager_user on true
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id on conflict (workspace_id, user_id) do
        update
        set
            department_id = excluded.department_id,
            role = excluded.role returning id
    ),
    upsert_member as (
        insert into
            public.workspace_members (
                workspace_id,
                user_id,
                department_id,
                role
            )
        select inserted_workspace.id, member_user.id, software_design_department.id, 'member'
        from
            inserted_workspace
            join member_user on true
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id on conflict (workspace_id, user_id) do
        update
        set
            department_id = excluded.department_id,
            role = excluded.role returning id
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
        select inserted_workspace.id, software_design_department.id, 'Plateforme de gestion centralisee', 'Conception logicielle, interfaces et parcours de pilotage', 'active', 41, coalesce(
                manager_user.id, inserted_workspace.owner_id
            )
        from
            inserted_workspace
            join software_design_department on software_design_department.workspace_id = inserted_workspace.id
            left join manager_user on true on conflict (workspace_id, name) do
        update
        set
            description = excluded.description,
            status = excluded.status,
            progress = excluded.progress returning id,
            workspace_id
    ),
    operations_project as (
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
        select inserted_workspace.id, operations_department.id, 'Coordination des operations terrain', 'Pilotage des flux d execution et coordination inter-services', 'active', 68, inserted_workspace.owner_id
        from
            inserted_workspace
            join operations_department on operations_department.workspace_id = inserted_workspace.id on conflict (workspace_id, name) do
        update
        set
            description = excluded.description,
            status = excluded.status,
            progress = excluded.progress returning id,
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
select software_design_project.workspace_id, software_design_project.id, 'Structurer le referentiel des departements dans l application', 'Synchronisation des services, des vues et du modele de donnees Supabase', 'in_progress', 'high', 'high', member_user.id, coalesce(
        manager_user.id, inserted_workspace.owner_id
    ), current_date + 5, 1000, coalesce(
        manager_user.id, inserted_workspace.owner_id
    )
from
    software_design_project
    join inserted_workspace on inserted_workspace.id = software_design_project.workspace_id
    left join manager_user on true
    left join member_user on true
where
    not exists (
        select 1
        from public.tasks t
        where
            t.project_id = software_design_project.id
            and t.title = 'Structurer le referentiel des departements dans l application'
    );
