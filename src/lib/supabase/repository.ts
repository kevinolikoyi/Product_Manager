import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import {
  normalizeDepartments,
  remapMemberDepartments,
  remapProjectDepartments,
} from '@/lib/supabase/departments';
import type { Department, Finance, Member, Project, Task } from '@/lib/types';

interface WorkspaceRow {
  id: number;
  name: string;
  slug: string;
}

interface DepartmentRow {
  id: number;
  name: string;
  slug: string;
}

interface CollaboratorRow {
  id: number;
  workspace_id: number;
  department_id: number | null;
  full_name: string;
  email: string | null;
  role: Member['role'];
}

interface ProjectRow {
  id: number;
  workspace_id: number;
  department_id: number;
  name: string;
  status: Project['status'];
  progress: number;
  created_by: number | null;
}

interface FinanceRow {
  id: number;
  workspace_id: number;
  department_id: number | null;
  period_start: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface TaskRow {
  id: number;
  workspace_id: number;
  project_id: number;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  risk: Task['risk'];
  assignee_id: number | null;
  assigned_by: number | null;
  due_date: string | null;
  position: number;
  created_by: number | null;
}

interface WorkspaceContext {
  workspace: WorkspaceRow;
  departments: DepartmentRow[];
  collaborators: CollaboratorRow[];
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
    candidate.code === '42703' ||
    candidate.code === 'PGRST204' ||
    candidate.code === 'PGRST205' ||
    candidate.message?.includes('financial_entries') === true
  );
}

async function resolveSnapshotSection<T>(
  label: string,
  loader: Promise<T>,
  fallback: T,
) {
  try {
    return await loader;
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }

    console.warn(`[supabase] Snapshot section "${label}" unavailable`, error);
    return fallback;
  }
}

function requireClient() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase n'est pas configure.");
  }

  return client;
}

function stringifyEntityId(value: number) {
  return String(value);
}

function parseEntityId(value?: string | number | null) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

async function getWorkspaceContext() {
  const client = requireClient();
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const { data: workspace, error: workspaceError } = await client
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', config.workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspace) {
    throw new Error(`Workspace introuvable pour le slug "${config.workspaceSlug}".`);
  }

  const [{ data: departments, error: departmentsError }, { data: collaborators, error: collaboratorsError }] =
    await Promise.all([
      client
        .from('departments')
        .select('id, name, slug')
        .eq('workspace_id', workspace.id)
        .order('name', { ascending: true }),
      client
        .from('collaborators')
        .select('id, workspace_id, department_id, full_name, email, role')
        .eq('workspace_id', workspace.id)
        .order('full_name', { ascending: true }),
    ]);

  if (departmentsError) {
    throw departmentsError;
  }

  if (collaboratorsError) {
    throw collaboratorsError;
  }

  return {
    workspace: workspace as WorkspaceRow,
    departments: (departments ?? []) as DepartmentRow[],
    collaborators: (collaborators ?? []) as CollaboratorRow[],
  } satisfies WorkspaceContext;
}

function countTasksByProjectId(tasks: TaskRow[]) {
  const counts = new Map<number, number>();

  for (const task of tasks) {
    counts.set(task.project_id, (counts.get(task.project_id) ?? 0) + 1);
  }

  return counts;
}

function mapProjects(rows: ProjectRow[], tasks: TaskRow[]) {
  const taskCountByProjectId = countTasksByProjectId(tasks);

  return rows.map((project) => ({
    id: stringifyEntityId(project.id),
    name: project.name,
    departmentId: stringifyEntityId(project.department_id),
    status: project.status,
    progress: project.progress,
    numberOfTasks: taskCountByProjectId.get(project.id) ?? 0,
  })) satisfies Project[];
}

function mapMembers(rows: CollaboratorRow[]) {
  return rows
    .map((collaborator) => ({
      id: stringifyEntityId(collaborator.id),
      name: collaborator.full_name,
      departmentId: collaborator.department_id ? stringifyEntityId(collaborator.department_id) : '',
      role: collaborator.role,
      email: collaborator.email ?? undefined,
    }))
    .sort((left, right) => left.name.localeCompare(right.name)) satisfies Member[];
}

function mapFinances(rows: FinanceRow[]) {
  return rows.map((entry) => ({
    id: stringifyEntityId(entry.id),
    periodStart: entry.period_start,
    revenue: entry.revenue,
    expenses: entry.expenses,
    profit: entry.profit,
  })) satisfies Finance[];
}

function mapTasks(rows: TaskRow[]) {
  return rows.map((task) => ({
    id: stringifyEntityId(task.id),
    title: task.title,
    projectId: stringifyEntityId(task.project_id),
    assigneeId: task.assignee_id ? stringifyEntityId(task.assignee_id) : undefined,
    status: task.status,
    priority: task.priority,
    risk: task.risk,
    dueDate: task.due_date ?? '',
  })) satisfies Task[];
}

async function fetchVisibleProjects(workspaceId: number) {
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

async function fetchFinanceEntries(workspaceId: number) {
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

async function fetchVisibleTasks(workspaceId: number) {
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

function resolveProjectDepartmentId(
  context: WorkspaceContext,
  project: Project,
  existing?: ProjectRow | null,
) {
  const normalizedDepartments = normalizeDepartments(context.departments);
  const catalogDepartmentId = normalizedDepartments.databaseDepartmentIdMap.get(
    project.departmentId,
  );

  if (catalogDepartmentId !== undefined) {
    return catalogDepartmentId;
  }

  const explicitDepartmentId = parseEntityId(project.departmentId);

  if (explicitDepartmentId !== null) {
    return explicitDepartmentId;
  }

  if (existing?.department_id) {
    return existing.department_id;
  }

  if (context.departments.length === 1) {
    return context.departments[0].id;
  }

  throw new Error(
    'Le departement selectionne est connu localement mais introuvable dans Supabase.',
  );
}

function resolveDefaultCollaboratorId(context: WorkspaceContext) {
  return context.collaborators[0]?.id ?? null;
}

async function fetchProjectRowById(projectId: string) {
  const parsedProjectId = parseEntityId(projectId);

  if (parsedProjectId === null) {
    return null;
  }

  const client = requireClient();
  const { data, error } = await client
    .from('projects')
    .select('id, workspace_id, department_id, name, status, progress, created_by')
    .eq('id', parsedProjectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ProjectRow | null;
}

async function fetchTaskRowById(taskId: string) {
  const parsedTaskId = parseEntityId(taskId);

  if (parsedTaskId === null) {
    return null;
  }

  const client = requireClient();
  const { data, error } = await client
    .from('tasks')
    .select(
      'id, workspace_id, project_id, title, status, priority, risk, assignee_id, assigned_by, due_date, position, created_by',
    )
    .eq('id', parsedTaskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TaskRow | null;
}

async function fetchFinancialEntryByPeriodStart(workspaceId: number, periodStart: string) {
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

async function resolveProjectIdById(workspaceId: number, projectId: string) {
  const parsedProjectId = parseEntityId(projectId);

  if (parsedProjectId === null) {
    throw new Error(`Le projet "${projectId}" est introuvable dans le workspace actif.`);
  }

  const client = requireClient();
  const { data, error } = await client
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('id', parsedProjectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Le projet "${projectId}" est introuvable dans le workspace actif.`);
  }

  return data.id as number;
}

export async function loadWorkspaceSnapshot() {
  const context = await getWorkspaceContext();

  if (!context) {
    return null;
  }

  const [projectRows, financeRows, taskRows] = await Promise.all([
    resolveSnapshotSection('projects', fetchVisibleProjects(context.workspace.id), [] as ProjectRow[]),
    resolveSnapshotSection(
      'financial_entries',
      fetchFinanceEntries(context.workspace.id),
      [] as FinanceRow[],
    ),
    resolveSnapshotSection('tasks', fetchVisibleTasks(context.workspace.id), [] as TaskRow[]),
  ]);

  const normalizedDepartments = normalizeDepartments(context.departments);
  const projects = remapProjectDepartments(
    mapProjects(projectRows, taskRows),
    normalizedDepartments.departmentIdMap,
  );
  const members = remapMemberDepartments(
    mapMembers(context.collaborators),
    normalizedDepartments.departmentIdMap,
  );

  if (normalizedDepartments.departments.length === 0) {
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
    departments: normalizedDepartments.departments,
    finances: mapFinances(financeRows),
    members,
    projects,
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
    workspace_id: context.workspace.id,
    department_id: null,
    period_start: finance.periodStart,
    revenue: finance.revenue,
    expenses: finance.expenses,
    profit: finance.profit,
  };

  const query = existingEntry
    ? client.from('financial_entries').update(payload).eq('id', existingEntry.id)
    : client.from('financial_entries').insert(payload);

  const { error } = await query;

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
    workspace_id: context.workspace.id,
    department_id: departmentId,
    name: project.name.trim(),
    status: project.status,
    progress: project.progress,
    created_by: existingProject?.created_by ?? resolveDefaultCollaboratorId(context),
  };

  const query = existingProject
    ? client.from('projects').update(payload).eq('id', existingProject.id)
    : client.from('projects').insert(payload);

  const { error } = await query;

  if (error) {
    throw error;
  }

  const persistedProject = existingProject
    ? await fetchProjectRowById(stringifyEntityId(existingProject.id))
    : await client
        .from('projects')
        .select('id, workspace_id, department_id, name, status, progress, created_by')
        .eq('workspace_id', context.workspace.id)
        .eq('name', project.name.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data, error: selectError }) => {
          if (selectError) {
            throw selectError;
          }

          if (!data) {
            throw new Error(
              "Le projet n'a pas ete confirme par Supabase. Verifiez la connexion et les policies.",
            );
          }

          return data as ProjectRow;
        });

  if (!persistedProject) {
    throw new Error(
      "Le projet n'a pas ete confirme par Supabase. Verifiez la connexion et les policies.",
    );
  }

  return mapProjects([persistedProject], [])[0];
}

export async function deleteProjectFromSupabase(projectId: string) {
  const parsedProjectId = parseEntityId(projectId);

  if (parsedProjectId === null) {
    throw new Error(`Le projet "${projectId}" est introuvable.`);
  }

  const client = requireClient();
  const { error } = await client.from('projects').delete().eq('id', parsedProjectId);

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
  const assigneeId = parseEntityId(task.assigneeId ?? null);
  const defaultCollaboratorId = resolveDefaultCollaboratorId(context);

  const payload = {
    workspace_id: context.workspace.id,
    project_id: projectId,
    title: task.title.trim(),
    status: task.status,
    priority: task.priority,
    risk: task.risk,
    assignee_id: assigneeId,
    assigned_by:
      existingTask?.assignee_id !== assigneeId && assigneeId
        ? defaultCollaboratorId
        : existingTask?.assigned_by ?? defaultCollaboratorId,
    due_date: task.dueDate || null,
    position: existingTask?.position ?? 1000,
    created_by: existingTask?.created_by ?? defaultCollaboratorId,
  };

  const query = existingTask
    ? client.from('tasks').update(payload).eq('id', existingTask.id)
    : client.from('tasks').insert(payload);

  const { error } = await query;

  if (error) {
    throw error;
  }
}

export async function deleteTaskFromSupabase(taskId: string) {
  const parsedTaskId = parseEntityId(taskId);

  if (parsedTaskId === null) {
    throw new Error(`La tache "${taskId}" est introuvable.`);
  }

  const client = requireClient();
  const { error } = await client.from('tasks').delete().eq('id', parsedTaskId);

  if (error) {
    throw error;
  }
}

export async function updateTaskStatusInSupabase(taskId: string, status: Task['status']) {
  const parsedTaskId = parseEntityId(taskId);

  if (parsedTaskId === null) {
    throw new Error(`La tache "${taskId}" est introuvable.`);
  }

  const client = requireClient();
  const { error } = await client
    .from('tasks')
    .update({
      status,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', parsedTaskId);

  if (error) {
    throw error;
  }
}

export async function addTaskCommentInSupabase(taskId: string, body: string) {
  const parsedTaskId = parseEntityId(taskId);

  if (parsedTaskId === null) {
    throw new Error(`La tache "${taskId}" est introuvable.`);
  }

  const client = requireClient();
  const { error } = await client.from('task_comments').insert({
    task_id: parsedTaskId,
    author_id: null,
    body: body.trim(),
  });

  if (error) {
    throw error;
  }
}

export function isSupabaseRemoteEnabled() {
  return getSupabasePublicConfig() !== null;
}
