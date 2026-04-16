'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/Button';
import { useFinances } from '@/lib/store';
import { useProjects } from '@/lib/store';
import { useTasks } from '@/lib/store';
import { Finance } from '@/data/mockFinances';

export default function ReportGenerator() {
  const { finances } = useFinances();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const generateReport = async () => {
    const doc = new jsPDF();
    const latestFinance = finances[finances.length - 1];

    doc.setFontSize(20);
    doc.text('Rapport Mensuel - CollabFlow', 20, 20);

    doc.setFontSize(14);
    doc.text('Finances:', 20, 40);
    doc.text(`Chiffre d\'affaires: €${latestFinance.revenue.toLocaleString()}`, 30, 55);
    doc.text(`Dépenses: €${latestFinance.expenses.toLocaleString()}`, 30, 65);
    doc.text(`Profit: €${latestFinance.profit.toLocaleString()}`, 30, 75);

    doc.text('Projets:', 20, 95);
    doc.text(`Actifs: ${projects.filter(p => p.status === 'active').length}`, 30, 110);
    doc.text(`Progression moyenne: ${Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%`, 30, 120);

    doc.text('Tâches:', 20, 140);
    doc.text(`Total: ${tasks.length}`, 30, 155);
    doc.text(`À faire: ${tasks.filter(t => t.status === 'todo').length}`, 30, 165);
    doc.text(`En cours: ${tasks.filter(t => t.status === 'in_progress').length}`, 30, 175);
    doc.text(`Terminées: ${tasks.filter(t => t.status === 'done').length}`, 30, 185);
    doc.text(`En retard: ${tasks.filter(t => t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'done').length}`, 30, 195);

    doc.save('rapport-collabflow.pdf');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <Button onClick={generateReport} className="bg-green-600 hover:bg-green-700 w-full">
        Générer rapport PDF
      </Button>
    </div>
  );
}

