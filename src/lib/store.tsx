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
  deleteTaskFromSupabase,
  isSupabaseRemoteEnabled,
  loadWorkspaceSnapshot,
  saveFinanceToSupabase,
  saveProjectToSupabase,
  saveTaskToSupabase,
  updateTaskStatusInSupabase,
  type WorkspaceSnapshot,
} from '@/lib/supabase/repository';
import { getDepartmentCatalog } from '@/lib/departments';
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

type UpdatePreferences = { type: 'UPDATE_PREFERENCES'; payload: Partial<WorkspacePreferences> };
type HydratePreferences = { type: 'HYDRATE_PREFERENCES'; payload: WorkspacePreferences };
type HydrateWorkspace = { type: 'HYDRATE_WORKSPACE'; payload: WorkspaceSnapshot };
type SetBackendStatus = { type: 'SET_BACKEND_STATUS'; payload: BackendStatus };
type ResetPreferences = { type: 'RESET_PREFERENCES' };

type Action =
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

const defaultBackendStatus: BackendStatus = {
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
  departments: getDepartmentCatalog(),
  members: [],
  preferences: defaultWorkspacePreferences,
  backendStatus: defaultBackendStatus,
};

const storeReducer = (state: StoreState, action: Action): StoreState => {
  switch (action.type) {
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

async function syncWorkspaceFromSupabase(dispatch: Dispatch<Action>) {
  const snapshot = await loadWorkspaceSnapshot();

  if (!snapshot) {
    throw new Error("Supabase n'est pas configure.");
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

  return snapshot;
}

function ensureSupabaseMutationAllowed(state: StoreState) {
  if (state.backendStatus.mode !== 'supabase') {
    throw new Error(
      state.backendStatus.error ??
        'Une connexion Supabase active est requise pour modifier les donnees.',
    );
  }
}

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
          error: "Supabase n'est pas configure.",
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

    void syncWorkspaceFromSupabase(dispatch).catch((error) => {
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
            error instanceof Error ? error.message : 'Connexion Supabase indisponible.',
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!preferencesReady) {
    return null;
  }

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
    ensureSupabaseMutationAllowed(state);
    await saveTaskToSupabase(task);
    await syncWorkspaceFromSupabase(dispatch);
  };

  const deleteTaskById = async (taskId: string) => {
    ensureSupabaseMutationAllowed(state);
    await deleteTaskFromSupabase(taskId);
    await syncWorkspaceFromSupabase(dispatch);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    ensureSupabaseMutationAllowed(state);
    await updateTaskStatusInSupabase(taskId, status);
    await syncWorkspaceFromSupabase(dispatch);
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
    ensureSupabaseMutationAllowed(state);
    const persistedProject = await saveProjectToSupabase(project);
    await syncWorkspaceFromSupabase(dispatch);
    return persistedProject;
  };

  const deleteProjectById = async (projectId: string) => {
    ensureSupabaseMutationAllowed(state);
    await deleteProjectFromSupabase(projectId);
    await syncWorkspaceFromSupabase(dispatch);
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
    ensureSupabaseMutationAllowed(state);
    await saveFinanceToSupabase(finance);
    await syncWorkspaceFromSupabase(dispatch);
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

    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'NA'
    );
  };

  return {
    getMemberName,
    getMemberInitials,
  };
};
