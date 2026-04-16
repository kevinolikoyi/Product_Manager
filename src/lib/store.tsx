'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { mockTasks, type Task } from '@/data/mockTasks';
import { mockProjects, type Project } from '@/data/mockProjects';

export interface StoreState {
    tasks: Task[];
    projects: Project[];
}

type AddTask = { type: 'ADD_TASK'; payload: Task };
type UpdateTask = { type: 'UPDATE_TASK'; payload: Task };
type DeleteTask = { type: 'DELETE_TASK'; payload: string };
type AddProject = { type: 'ADD_PROJECT'; payload: Project };
type UpdateProject = { type: 'UPDATE_PROJECT'; payload: Project };
type DeleteProject = { type: 'DELETE_PROJECT'; payload: string };

type Action = AddTask | UpdateTask | DeleteTask | AddProject | UpdateProject | DeleteProject;

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
        default:
            return state;
    }
};

const initialState: StoreState = {
    tasks: mockTasks,
    projects: mockProjects,
};

const StoreContext = createContext<{
    state: StoreState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(storeReducer, initialState);
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

