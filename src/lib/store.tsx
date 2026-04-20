'use client';

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useState,
    type ReactNode,
} from 'react';
import { mockTasks, type Task } from '@/data/mockTasks';
import { mockProjects, type Project } from '@/data/mockProjects';
import { mockFinances, type Finance } from '@/data/mockFinances';

export interface WorkspacePreferences {
    density: 'comfortable' | 'compact';
    contentWidth: 'focused' | 'fluid';
    desktopSidebar: 'expanded' | 'compact';
    showInsights: boolean;
}

export interface StoreState {
    tasks: Task[];
    projects: Project[];
    finances: Finance[];
    preferences: WorkspacePreferences;
}

type AddTask = { type: 'ADD_TASK'; payload: Task };
type UpdateTask = { type: 'UPDATE_TASK'; payload: Task };
type DeleteTask = { type: 'DELETE_TASK'; payload: string };
type AddProject = { type: 'ADD_PROJECT'; payload: Project };
type UpdateProject = { type: 'UPDATE_PROJECT'; payload: Project };
type DeleteProject = { type: 'DELETE_PROJECT'; payload: string };
type UpdateFinances = { type: 'UPDATE_FINANCES'; payload: Finance[] };
type UpdatePreferences = { type: 'UPDATE_PREFERENCES'; payload: Partial<WorkspacePreferences> };
type HydratePreferences = { type: 'HYDRATE_PREFERENCES'; payload: WorkspacePreferences };
type ResetPreferences = { type: 'RESET_PREFERENCES' };

type Action =
    | AddTask
    | UpdateTask
    | DeleteTask
    | AddProject
    | UpdateProject
    | DeleteProject
    | UpdateFinances
    | UpdatePreferences
    | HydratePreferences
    | ResetPreferences;

const workspacePreferencesStorageKey = 'collabflow-workspace-preferences-v2';

export const defaultWorkspacePreferences: WorkspacePreferences = {
    density: 'comfortable',
    contentWidth: 'fluid',
    desktopSidebar: 'expanded',
    showInsights: true,
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
        showInsights: typeof candidate.showInsights === 'boolean' ? candidate.showInsights : true,
    };
}

const storeReducer = (state: StoreState, action: Action): StoreState => {
    switch (action.type) {
        case 'ADD_TASK':
            return { ...state, tasks: [action.payload, ...state.tasks] };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
            };
        case 'DELETE_TASK':
            return {
                ...state,
                tasks: state.tasks.filter((t) => t.id !== action.payload),
            };
        case 'ADD_PROJECT':
            return { ...state, projects: [action.payload, ...state.projects] };
        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
            };
        case 'DELETE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter((p) => p.id !== action.payload),
            };
        case 'UPDATE_FINANCES':
            return {
                ...state,
                finances: action.payload,
            };
        case 'UPDATE_PREFERENCES':
            return {
                ...state,
                preferences: {
                    ...state.preferences,
                    ...action.payload,
                },
            };
        case 'HYDRATE_PREFERENCES':
            return {
                ...state,
                preferences: action.payload,
            };
        case 'RESET_PREFERENCES':
            return {
                ...state,
                preferences: defaultWorkspacePreferences,
            };
        default:
            return state;
    }
};

const initialState: StoreState = {
    tasks: mockTasks,
    projects: mockProjects,
    finances: mockFinances,
    preferences: defaultWorkspacePreferences,
};

const StoreContext = createContext<{
    state: StoreState;
    dispatch: React.Dispatch<Action>;
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

    return (
        <StoreContext.Provider value={{ state, dispatch }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
};

export const useTasks = () => {
    const { state, dispatch } = useStore();
    return { tasks: state.tasks, dispatch };
};

export const useProjects = () => {
    const { state, dispatch } = useStore();
    return { projects: state.projects, dispatch };
};

export const useFinances = () => {
    const { state, dispatch } = useStore();
    return { finances: state.finances, dispatch };
};

export const useWorkspacePreferences = () => {
    const { state, dispatch } = useStore();
    return { preferences: state.preferences, dispatch };
};

