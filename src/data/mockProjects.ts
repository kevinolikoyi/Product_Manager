export interface Project {
    id: string;
    name: string;
    status: 'active' | 'completed' | 'on_hold';
    progress: number;
    numberOfTasks: number;
}

export const mockProjects: Project[] = [
    {
        id: '1',
        name: 'User Onboarding',
        status: 'active',
        progress: 65,
        numberOfTasks: 12,
    },
    {
        id: '2',
        name: 'Backend Development',
        status: 'active',
        progress: 40,
        numberOfTasks: 25,
    },
    {
        id: '3',
        name: 'UI/UX Design',
        status: 'active',
        progress: 80,
        numberOfTasks: 8,
    },
    {
        id: '4',
        name: 'DevOps',
        status: 'on_hold',
        progress: 20,
        numberOfTasks: 15,
    },
    {
        id: '5',
        name: 'Security Audit',
        status: 'active',
        progress: 10,
        numberOfTasks: 10,
    },
    {
        id: '6',
        name: 'Performance',
        status: 'completed',
        progress: 100,
        numberOfTasks: 18,
    },
];