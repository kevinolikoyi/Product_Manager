export interface Finance {
    id: string;
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export const mockFinances: Finance[] = [
    {
        id: '1',
        month: 'Jan 2024',
        revenue: 125000,
        expenses: 85000,
        profit: 40000,
    },
    {
        id: '2',
        month: 'Feb 2024',
        revenue: 142000,
        expenses: 92000,
        profit: 50000,
    },
    {
        id: '3',
        month: 'Mar 2024',
        revenue: 158000,
        expenses: 98000,
        profit: 60000,
    },
    {
        id: '4',
        month: 'Avr 2024',
        revenue: 172000,
        expenses: 105000,
        profit: 67000,
    },
];

