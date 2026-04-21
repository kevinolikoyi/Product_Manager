'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  deleteProjectFromSupabase,
  saveFinanceToSupabase,
  deleteTaskFromSupabase,
  isSupabaseRemoteEnabled,
  loadWorkspaceSnapshot,
  saveProjectToSupabase,
  saveTaskToSupabase,
  updateTaskStatusInSupabase,
  type WorkspaceSnapshot,
} from '@/lib/supabase/repository';
import type { Department, Finance, Member, Project, Task } from '@/lib/types';

export interface WorkspacePreferences {
  density: 'comfortable' | 'compact';
  contentWidth: 'focused' | 'fluid';
  desktopSidebar: 'expanded' | 'compact';
  showInsights: boolean;
}

export interface BackendStatus {
  configured: boolean;
  mode: 'mock' | 'supabase';
  loading: boolean;
  error: string | null;
}

export interface StoreState {
  tasks: Task[];
  projects: Project[];
  finances: Finance[];
  departments: Department[];
  members: Member[];
  preferences: WorkspacePreferences;
  backendStatus: BackendStatus;
}

type AddTask = { type: 'ADD_TASK'; payload: Task };
type UpdateTask = { type: 'UPDATE_TASK'; payload: Task };
type DeleteTask = { type: 'DELETE_TASK'; payload: string };
type UpdateTaskStatus = { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: Task['status'] } };
type AddProject = { type: 'ADD_PROJECT'; payload: Project };
type UpdateProject = { type: 'UPDATE_PROJECT'; payload: Project };
type DeleteProject = { type: 'DELETE_PROJECT'; payload: string };
type UpdateFinances = { type: 'UPDATE_FINANCES'; payload: Finance[] };
type UpdatePreferences = { type: 'UPDATE_PREFERENCES'; payload: Partial<WorkspacePreferences> };
type HydratePreferences = { type: 'HYDRATE_PREFERENCES'; payload: WorkspacePreferences };
type HydrateWorkspace = { type: 'HYDRATE_WORKSPACE'; payload: WorkspaceSnapshot };
type SetBackendStatus = { type: 'SET_BACKEND_STATUS'; payload: BackendStatus };
type ResetPreferences = { type: 'RESET_PREFERENCES' };

type Action =
  | AddTask
  | UpdateTask
  | DeleteTask
  | UpdateTaskStatus
  | AddProject
  | UpdateProject
  | DeleteProject
  | UpdateFinances
  | UpdatePreferences
  | HydratePreferences
  | HydrateWorkspace
  | SetBackendStatus
  | ResetPreferences;

const workspacePreferencesStorageKey = 'collabflow-workspace-preferences-v2';

export const defaultWorkspacePreferences: WorkspacePreferences = {
  density: 'comfortable',
  contentWidth: 'fluid',
  desktopSidebar: 'expanded',
  showInsights: true,
};

const initialBackendStatus: BackendStatus = {
  configured: false,
  mode: 'mock',
  loading: true,
  error: null,
};

function sanitizePreferences(value: unknown): WorkspacePreferences {
  if (!value || typeof value !== 'object') {
    return defaultWorkspacePreferences;
  }

  const candidate = value as Partial<WorkspacePreferences>;

  return {
    density: candidate.density === 'compact' ? 'compact' : 'comfortable',
    contentWidth: candidate.contentWidth === 'focused' ? 'focused' : 'fluid',
    desktopSidebar: candidate.desktopSidebar === 'compact' ? 'compact' : 'expanded',
    showInsights:
      typeof candidate.showInsights === 'boolean'
        ? candidate.showInsights
        : defaultWorkspacePreferences.showInsights,
  };
}

function syncProjectTaskCounts(projects: Project[], tasks: Task[]) {
  const taskCountByProjectId = tasks.reduce<Map<string, number>>((counts, task) => {
    counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
    return counts;
  }, new Map());

  return projects.map((project) => ({
    ...project,
    numberOfTasks: taskCountByProjectId.get(project.id) ?? 0,
  }));
}

function sortFinances(finances: Finance[]) {
  return [...finances].sort((left, right) => left.periodStart.localeCompare(right.periodStart));
}

const initialState: StoreState = {
  tasks: [],
  projects: [],
  finances: [],
  departments: [],
  members: [],
  preferences: defaultWorkspacePreferences,
  backendStatus: initialBackendStatus,
};

const storeReducer = (state: StoreState, action: Action): StoreState => {
  switch (action.type) {
    case 'ADD_TASK': {
      const tasks = [action.payload, ...state.tasks];
      return { ...state, tasks, projects: syncProjectTaskCounts(state.projects, tasks) };
    }
    case 'UPDATE_TASK': {
      const tasks = state.tasks.map((task) =>
        task.id === action.payload.id ? action.payload : task,
      );
      return { ...state, tasks, projects: syncProjectTaskCounts(state.projects, tasks) };
    }
    case 'DELETE_TASK': {
      const tasks = state.tasks.filter((task) => task.id !== action.payload);
      return { ...state, tasks, projects: syncProjectTaskCounts(state.projects, tasks) };
    }
    case 'UPDATE_TASK_STATUS': {
      const tasks = state.tasks.map((task) =>
        task.id === action.payload.id ? { ...task, status: action.payload.status } : task,
      );
      return { ...state, tasks };
    }
    case 'ADD_PROJECT': {
      const projects = syncProjectTaskCounts([action.payload, ...state.projects], state.tasks);
      return { ...state, projects };
    }
    case 'UPDATE_PROJECT': {
      const projects = syncProjectTaskCounts(
        state.projects.map((project) =>
          project.id === action.payload.id ? action.payload : project,
        ),
        state.tasks,
      );
      return { ...state, projects };
    }
    case 'DELETE_PROJECT': {
      const tasks = state.tasks.filter((task) => task.projectId !== action.payload);
      const projects = state.projects.filter((project) => project.id !== action.payload);
      return { ...state, tasks, projects: syncProjectTaskCounts(projects, tasks) };
    }
    case 'UPDATE_FINANCES':
      return { ...state, finances: sortFinances(action.payload) };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    case 'HYDRATE_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'HYDRATE_WORKSPACE':
      return {
        ...state,
        tasks: action.payload.tasks,
        projects: syncProjectTaskCounts(action.payload.projects, action.payload.tasks),
        finances: sortFinances(action.payload.finances),
        departments: action.payload.departments,
        members: action.payload.members,
      };
    case 'SET_BACKEND_STATUS':
      return { ...state, backendStatus: action.payload };
    case 'RESET_PREFERENCES':
      return { ...state, preferences: defaultWorkspacePreferences };
    default:
      return state;
  }
};

const StoreContext = createContext<{
  state: StoreState;
  dispatch: Dispatch<Action>;
} | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(workspacePreferencesStorageKey);
      if (storedValue) {
        dispatch({
          type: 'HYDRATE_PREFERENCES',
          payload: sanitizePreferences(JSON.parse(storedValue)),
        });
      }
    } catch {
      window.localStorage.removeItem(workspacePreferencesStorageKey);
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) {
      return;
    }

    window.localStorage.setItem(
      workspacePreferencesStorageKey,
      JSON.stringify(state.preferences),
    );
  }, [preferencesReady, state.preferences]);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseRemoteEnabled()) {
      dispatch({
        type: 'SET_BACKEND_STATUS',
        payload: {
          configured: false,
          mode: 'mock',
          loading: false,
          error: null,
        },
      });
      return () => {
        cancelled = true;
      };
    }

    dispatch({
      type: 'SET_BACKEND_STATUS',
      payload: {
        configured: true,
        mode: 'mock',
        loading: true,
        error: null,
      },
    });

    void loadWorkspaceSnapshot()
      .then((snapshot) => {
        if (cancelled || !snapshot) {
          return;
        }

        dispatch({ type: 'HYDRATE_WORKSPACE', payload: snapshot });
        dispatch({
          type: 'SET_BACKEND_STATUS',
          payload: {
            configured: true,
            mode: 'supabase',
            loading: false,
            error: null,
          },
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        dispatch({
          type: 'SET_BACKEND_STATUS',
          payload: {
            configured: true,
            mode: 'mock',
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Connexion Supabase indisponible. Le mode local reste actif.',
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  return context;
};

export const useTasks = () => {
  const { state, dispatch } = useStore();

  const saveTask = async (task: Task) => {
    if (state.backendStatus.mode === 'supabase') {
      await saveTaskToSupabase(task);
    }

    dispatch({
      type: state.tasks.some((currentTask) => currentTask.id === task.id) ? 'UPDATE_TASK' : 'ADD_TASK',
      payload: task,
    });
  };

  const deleteTaskById = async (taskId: string) => {
    if (state.backendStatus.mode === 'supabase') {
      await deleteTaskFromSupabase(taskId);
    }

    dispatch({ type: 'DELETE_TASK', payload: taskId });
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (state.backendStatus.mode === 'supabase') {
      await updateTaskStatusInSupabase(taskId, status);
    }

    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: taskId, status } });
  };

  return {
    tasks: state.tasks,
    dispatch,
    saveTask,
    deleteTaskById,
    updateTaskStatus,
  };
};

export const useProjects = () => {
  const { state, dispatch } = useStore();

  const saveProject = async (project: Project) => {
    if (state.backendStatus.mode === 'supabase') {
      await saveProjectToSupabase(project);
    }

    dispatch({
      type: state.projects.some((currentProject) => currentProject.id === project.id)
        ? 'UPDATE_PROJECT'
        : 'ADD_PROJECT',
      payload: project,
    });
  };

  const deleteProjectById = async (projectId: string) => {
    if (state.backendStatus.mode === 'supabase') {
      await deleteProjectFromSupabase(projectId);
    }

    dispatch({ type: 'DELETE_PROJECT', payload: projectId });
  };

  return {
    projects: state.projects,
    dispatch,
    saveProject,
    deleteProjectById,
  };
};

export const useFinances = () => {
  const { state, dispatch } = useStore();

  const saveFinance = async (finance: Finance) => {
    if (state.backendStatus.mode === 'supabase') {
      await saveFinanceToSupabase(finance);
    }

    const nextFinances = state.finances.some((entry) => entry.id === finance.id)
      ? state.finances.map((entry) => (entry.id === finance.id ? finance : entry))
      : [...state.finances, finance];

    dispatch({ type: 'UPDATE_FINANCES', payload: nextFinances });
  };

  return { finances: state.finances, dispatch, saveFinance };
};

export const useDepartments = () => {
  const { state } = useStore();
  return { departments: state.departments };
};

export const useMembers = () => {
  const { state } = useStore();
  return { members: state.members };
};

export const useWorkspacePreferences = () => {
  const { state, dispatch } = useStore();
  return { preferences: state.preferences, dispatch };
};

export const useBackendStatus = () => {
  const { state } = useStore();
  return state.backendStatus;
};

export const useProjectDirectory = () => {
  const { state } = useStore();

  const getDepartmentName = (departmentId?: string) =>
    state.departments.find((department) => department.id === departmentId)?.name ??
    'Departement inconnu';

  const getProjectName = (projectId?: string) =>
    state.projects.find((project) => project.id === projectId)?.name ?? 'Projet inconnu';

  const getProjectDepartmentName = (projectId?: string) => {
    const project = state.projects.find((candidate) => candidate.id === projectId);
    return getDepartmentName(project?.departmentId);
  };

  return {
    getDepartmentName,
    getProjectName,
    getProjectDepartmentName,
  };
};

export const useMemberDirectory = () => {
  const { state } = useStore();

  const getMemberName = (memberId?: string) =>
    state.members.find((member) => member.id === memberId)?.name ?? 'Non assigne';

  const getMemberInitials = (memberId?: string) => {
    const name = getMemberName(memberId);

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'NA';
  };

  return {
    getMemberName,
    getMemberInitials,
  };
};

