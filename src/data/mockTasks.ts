export interface Task {
    id: string;
    title: string;
    project: string;
    assignee?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    dueDate: string;
}

export const mockTasks: Task[] = [
    {
        id: '1',
        title: 'Design user authentication flow',
        project: 'User Onboarding',
        assignee: 'Alice Martin',
        status: 'in_progress',
        priority: 'high',
        risk: 'medium',
        dueDate: '2024-04-20',
    },
    {
        id: '2',
        title: 'Implement API endpoints',
        project: 'Backend Development',
        assignee: 'Bob Dupont',
        status: 'todo',
        priority: 'high',
        risk: 'high',
        dueDate: '2024-04-18',
    },
    {
        id: '3',
        title: 'Write unit tests',
        project: 'Backend Development',
        status: 'done',
        priority: 'medium',
        risk: 'low',
        dueDate: '2024-04-15',
    },
    {
        id: '4',
        title: 'Create dashboard mockups',
        project: 'UI/UX Design',
        status: 'in_progress',
        priority: 'medium',
        risk: 'low',
        dueDate: '2024-04-22',
    },
    {
        id: '5',
        title: 'Set up CI/CD pipeline',
        project: 'DevOps',
        status: 'todo',
        priority: 'low',
        risk: 'medium',
        dueDate: '2024-04-25',
    },
    {
        id: '6',
        title: 'Review code for security',
        project: 'Security Audit',
        status: 'todo',
        priority: 'high',
        risk: 'high',
        dueDate: '2024-04-17',
    },
    {
        id: '7',
        title: 'Optimize database queries',
        project: 'Performance',
        status: 'in_progress',
        priority: 'medium',
        risk: 'medium',
        dueDate: '2024-04-19',
    },
    {
        id: '8',
        title: 'Update documentation',
        project: 'Documentation',
        status: 'done',
        priority: 'low',
        risk: 'low',
        dueDate: '2024-04-16',
    },
];