import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import type { Department, Finance, Member, Project, Task } from '@/lib/types';

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface WorkspaceMemberRow {
  user_id: string;
  role: Member['role'];
  department_id: string | null;
}

interface DepartmentRow {
  id: string;
  name: string;
  slug: string;
}

interface ProjectRow {
  id: string;
  workspace_id: string;
  department_id: string;
  name: string;
  status: Project['status'];
  progress: number;
  created_by: string;
}

interface FinanceRow {
  id: string;
  workspace_id: string;
  department_id: string | null;
  period_start: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface TaskRow {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  risk: Task['risk'];
  assignee_id: string | null;
  assigned_by: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface WorkspaceContext {
  workspace: WorkspaceRow;
  departments: DepartmentRow[];
}

export interface WorkspaceSnapshot {
  mode: 'supabase';
  workspaceName: string;
  departments: Department[];
  finances: Finance[];
  members: Member[];
  projects: Project[];
  tasks: Task[];
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string };

  return (
    candidate.code === '42P01' ||
    candidate.code === 'PGRST205' ||
    candidate.message?.includes('financial_entries') === true
  );
}

function requireClient() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase n'est pas configure.");
  }

  return client;
}

async function getWorkspaceContext() {
  const client = requireClient();
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const { data: workspace, error: workspaceError } = await client
    .from('workspaces')
    .select('id, name, slug, owner_id')
    .eq('slug', config.workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspace) {
    throw new Error(`Workspace introuvable pour le slug "${config.workspaceSlug}".`);
  }

  const { data: departments, error: departmentsError } = await client
    .from('departments')
    .select('id, name, slug')
    .eq('workspace_id', workspace.id)
    .order('name', { ascending: true });

  if (departmentsError) {
    throw departmentsError;
  }

  return {
    workspace: workspace as WorkspaceRow,
    departments: (departments ?? []) as DepartmentRow[],
  } satisfies WorkspaceContext;
}

function countTasksByProjectId(tasks: TaskRow[]) {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    counts.set(task.project_id, (counts.get(task.project_id) ?? 0) + 1);
  }

  return counts;
}

function mapProjects(rows: ProjectRow[], tasks: TaskRow[]) {
  const taskCountByProjectId = countTasksByProjectId(tasks);

  return rows.map((project) => ({
    id: project.id,
    name: project.name,
    departmentId: project.department_id,
    status: project.status,
    progress: project.progress,
    numberOfTasks: taskCountByProjectId.get(project.id) ?? 0,
  })) satisfies Project[];
}

function mapMembers(rows: WorkspaceMemberRow[], profiles: ProfileRow[]) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows
    .map((member) => {
      const profile = profileById.get(member.user_id);

      return {
        id: member.user_id,
        name: profile?.full_name || profile?.email || 'Utilisateur sans nom',
        departmentId: member.department_id ?? '',
        role: member.role,
        email: profile?.email ?? undefined,
      } satisfies Member;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function mapFinances(rows: FinanceRow[]) {
  return rows.map((entry) => ({
    id: entry.id,
    periodStart: entry.period_start,
    revenue: entry.revenue,
    expenses: entry.expenses,
    profit: entry.profit,
  })) satisfies Finance[];
}

function mapTasks(rows: TaskRow[]) {
  return rows.map((task) => ({
    id: task.id,
    title: task.title,
    projectId: task.project_id,
    assigneeId: task.assignee_id ?? undefined,
    status: task.status,
    priority: task.priority,
    risk: task.risk,
    dueDate: task.due_date ?? '',
  })) satisfies Task[];
}

async function fetchVisibleProjects(workspaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('projects')
    .select('id, workspace_id, department_id, name, status, progress, created_by')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProjectRow[];
}

async function fetchWorkspaceMembers(workspaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('workspace_members')
    .select('user_id, role, department_id')
    .eq('workspace_id', workspaceId);

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkspaceMemberRow[];
}

async function fetchFinanceEntries(workspaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('financial_entries')
    .select('id, workspace_id, department_id, period_start, revenue, expenses, profit')
    .eq('workspace_id', workspaceId)
    .is('department_id', null)
    .order('period_start', { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw error;
  }

  return (data ?? []) as FinanceRow[];
}

async function fetchVisibleTasks(workspaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('tasks')
    .select(
      'id, workspace_id, project_id, title, status, priority, risk, assignee_id, assigned_by, due_date, position, created_by',
    )
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TaskRow[];
}

async function fetchProfilesByIds(ids: string[]) {
  const client = requireClient();

  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRow[];
}

function resolveProjectDepartmentId(context: WorkspaceContext, project: Project, existing?: ProjectRow | null) {
  if (project.departmentId) {
    return project.departmentId;
  }

  if (existing?.department_id) {
    return existing.department_id;
  }

  if (context.departments.length === 1) {
    return context.departments[0].id;
  }

  throw new Error('La creation de projet exige un departement explicite.');
}

async function fetchProjectRowById(projectId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('projects')
    .select('id, workspace_id, department_id, name, status, progress, created_by')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ProjectRow | null;
}

async function fetchTaskRowById(taskId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('tasks')
    .select(
      'id, workspace_id, project_id, title, status, priority, risk, assignee_id, assigned_by, due_date, position, created_by',
    )
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TaskRow | null;
}

async function fetchFinancialEntryByPeriodStart(workspaceId: string, periodStart: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('financial_entries')
    .select('id, workspace_id, department_id, period_start, revenue, expenses, profit')
    .eq('workspace_id', workspaceId)
    .is('department_id', null)
    .eq('period_start', periodStart)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? null) as FinanceRow | null;
}

async function resolveProjectIdById(workspaceId: string, projectId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Le projet "${projectId}" est introuvable dans le workspace actif.`);
  }

  return data.id;
}

export async function loadWorkspaceSnapshot() {
  const context = await getWorkspaceContext();

  if (!context) {
    return null;
  }

  const [projectRows, financeRows, memberRows, taskRows] = await Promise.all([
    fetchVisibleProjects(context.workspace.id),
    fetchFinanceEntries(context.workspace.id),
    fetchWorkspaceMembers(context.workspace.id),
    fetchVisibleTasks(context.workspace.id),
  ]);

  const profileIds = [
    ...new Set(
      memberRows
        .map((member) => member.user_id)
        .concat(
          taskRows
            .map((task) => task.assignee_id)
            .filter((value): value is string => Boolean(value)),
        ),
    ),
  ];
  const profiles = await fetchProfilesByIds(profileIds);

  if (context.departments.length === 0) {
    const config = getSupabasePublicConfig();
    console.warn('[supabase] Workspace loaded without departments', {
      workspaceSlug: config?.workspaceSlug,
      workspaceId: context.workspace.id,
      workspaceName: context.workspace.name,
      supabaseUrl: config?.url,
    });
  }

  return {
    mode: 'supabase',
    workspaceName: context.workspace.name,
    departments: context.departments,
    finances: mapFinances(financeRows),
    members: mapMembers(memberRows, profiles),
    projects: mapProjects(projectRows, taskRows),
    tasks: mapTasks(taskRows),
  } satisfies WorkspaceSnapshot;
}

export async function saveFinanceToSupabase(finance: Finance) {
  const context = await getWorkspaceContext();

  if (!context) {
    throw new Error("Supabase n'est pas configure.");
  }

  const client = requireClient();
  const existingEntry = await fetchFinancialEntryByPeriodStart(
    context.workspace.id,
    finance.periodStart,
  );

  const payload = {
    id: existingEntry?.id ?? finance.id,
    workspace_id: context.workspace.id,
    department_id: null,
    period_start: finance.periodStart,
    revenue: finance.revenue,
    expenses: finance.expenses,
    profit: finance.profit,
  };

  const { error } = await client.from('financial_entries').upsert(payload, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}

export async function saveProjectToSupabase(project: Project) {
  const context = await getWorkspaceContext();

  if (!context) {
    throw new Error("Supabase n'est pas configure.");
  }

  const client = requireClient();
  const existingProject = await fetchProjectRowById(project.id);
  const departmentId = resolveProjectDepartmentId(context, project, existingProject);

  const payload = {
    id: project.id,
    workspace_id: context.workspace.id,
    department_id: departmentId,
    name: project.name.trim(),
    status: project.status,
    progress: project.progress,
    created_by: existingProject?.created_by ?? context.workspace.owner_id,
  };

  const { error } = await client.from('projects').upsert(payload, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}

export async function deleteProjectFromSupabase(projectId: string) {
  const client = requireClient();
  const { error } = await client.from('projects').delete().eq('id', projectId);

  if (error) {
    throw error;
  }
}

export async function saveTaskToSupabase(task: Task) {
  const context = await getWorkspaceContext();

  if (!context) {
    throw new Error("Supabase n'est pas configure.");
  }

  const client = requireClient();
  const existingTask = await fetchTaskRowById(task.id);
  const projectId = await resolveProjectIdById(context.workspace.id, task.projectId);

  const payload = {
    id: task.id,
    workspace_id: context.workspace.id,
    project_id: projectId,
    title: task.title.trim(),
    status: task.status,
    priority: task.priority,
    risk: task.risk,
    assignee_id: task.assigneeId ?? null,
    assigned_by:
      existingTask?.assignee_id !== (task.assigneeId ?? null) && task.assigneeId
        ? context.workspace.owner_id
        : existingTask?.assigned_by ?? context.workspace.owner_id,
    due_date: task.dueDate || null,
    position: existingTask?.position ?? 1000,
    created_by: existingTask?.created_by ?? context.workspace.owner_id,
  };

  const { error } = await client.from('tasks').upsert(payload, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}

export async function deleteTaskFromSupabase(taskId: string) {
  const client = requireClient();
  const { error } = await client.from('tasks').delete().eq('id', taskId);

  if (error) {
    throw error;
  }
}

export async function updateTaskStatusInSupabase(taskId: string, status: Task['status']) {
  const client = requireClient();
  const { error } = await client
    .from('tasks')
    .update({
      status,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    throw error;
  }
}

export async function addTaskCommentInSupabase(taskId: string, body: string) {
  const context = await getWorkspaceContext();

  if (!context) {
    throw new Error("Supabase n'est pas configure.");
  }

  const client = requireClient();
  const { error } = await client.from('task_comments').insert({
    task_id: taskId,
    author_id: context.workspace.owner_id,
    body: body.trim(),
  });

  if (error) {
    throw error;
  }
}

export function isSupabaseRemoteEnabled() {
  return getSupabasePublicConfig() !== null;
}
