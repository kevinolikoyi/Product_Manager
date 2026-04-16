'use client';

import { useState } from 'react';
import { useFinances } from '@/lib/store';
import { Finance } from '@/data/mockFinances';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FinanceFormProps {
  onClose: () => void;
  month: string;
}

export default function FinanceForm({ onClose, month }: FinanceFormProps) {
  const { finances, dispatch } = useFinances();
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFinance: Finance = {
      id: Date.now().toString(),
      month,
      revenue: parseInt(revenue) || 0,
      expenses: parseInt(expenses) || 0,
      profit: (parseInt(revenue) || 0) - (parseInt(expenses) || 0),
    };
    const updatedFinances = [...finances, newFinance].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    dispatch({ type: 'UPDATE_FINANCES' as const, payload: updatedFinances });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Saisir finances {month}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chiffre d'affaires (€)</label>
            <Input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dépenses (€)</label>
            <Input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

