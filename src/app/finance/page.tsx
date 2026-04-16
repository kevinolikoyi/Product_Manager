'use client';

import Layout from '@/components/layout/Layout';
import KPI from '@/components/dashboard/KPI';
import FinanceForm from '@/components/dashboard/FinanceForm';
import { useFinances } from '@/lib/store';
import { useState } from 'react';

export default function FinancePage() {
  const { finances } = useFinances();
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState('');

  const latestFinance = finances[finances.length - 1];
  const prevFinance = finances[finances.length - 2];

  const revenueTrend = prevFinance ? ((latestFinance.revenue - prevFinance.revenue) / prevFinance.revenue * 100).toFixed(1) : 0;
  const expensesTrend = prevFinance ? ((latestFinance.expenses - prevFinance.expenses) / prevFinance.expenses * 100).toFixed(1) : 0;
  const profitTrend = prevFinance ? ((latestFinance.profit - prevFinance.profit) / prevFinance.profit * 100).toFixed(1) : 0;

  const handleAddMonth = () => {
    setShowForm(true);
  };

  const months = ['Jan 2024', 'Fév 2024', 'Mar 2024', 'Avr 2024', 'Mai 2024', 'Juin 2024'];

  return (
    <Layout>
      <div className="space-y-6 p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
          <button 
            onClick={handleAddMonth}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            ➕ Nouveau mois
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPI title="Chiffre d'affaires" value={`€${latestFinance.revenue.toLocaleString()}`} color="green" trend={Number(revenueTrend)} />
          <KPI title="Dépenses" value={`€${latestFinance.expenses.toLocaleString()}`} color="red" trend={Number(expensesTrend)} />
          <KPI title="Profit" value={`€${latestFinance.profit.toLocaleString()}`} color="green" trend={Number(profitTrend)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {months.slice(-6).map(m => {
            const finance = finances.find(f => f.month === m);
            return (
              <div key={m} className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2">{m}</h3>
                {finance ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">€{finance.revenue.toLocaleString()}</p>
                    <p className="text-lg text-gray-600">Profit: €{finance.profit.toLocaleString()}</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setMonth(m);
                      setShowForm(true);
                    }}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    ➕ Saisir données
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showForm && (
          <FinanceForm 
            month={month || 'Nouveau mois'} 
            onClose={() => setShowForm(false)} 
          />
        )}
      </div>
    </Layout>
  );
}

