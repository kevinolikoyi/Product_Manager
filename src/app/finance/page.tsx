"use client";

import { useState } from "react";
import { Banknote, ReceiptText, Wallet } from "lucide-react";
import KPI from "@/components/dashboard/KPI";
import FinanceForm from "@/components/dashboard/FinanceForm";
import Layout from "@/components/layout/Layout";
import { useFinances } from "@/lib/store";
import { formatCompactCurrency } from "@/lib/utils";

export default function FinancePage() {
  const { finances } = useFinances();
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState("");

  const latestFinance = finances[finances.length - 1];
  const previousFinance = finances[finances.length - 2];

  const getTrend = (current: number, previous?: number) => {
    if (!previous) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  };

  const months = ["Jan 2024", "Fev 2024", "Mar 2024", "Avr 2024", "Mai 2024", "Juin 2024"];

  return (
    <Layout
      title="Finances"
      eyebrow="Performance"
      description="Suivi synthétique des revenus, depenses et marge mensuelle."
      actions={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
        >
          Nouveau mois
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KPI
            title="Chiffre d'affaires"
            value={formatCompactCurrency(latestFinance.revenue)}
            icon={Banknote}
            iconTone="emerald"
            trend={getTrend(latestFinance.revenue, previousFinance?.revenue)}
            trendLabel="vs mois precedent"
          />
          <KPI
            title="Depenses"
            value={formatCompactCurrency(latestFinance.expenses)}
            icon={ReceiptText}
            iconTone="red"
            trend={getTrend(latestFinance.expenses, previousFinance?.expenses)}
            trendLabel="vs mois precedent"
          />
          <KPI
            title="Profit"
            value={formatCompactCurrency(latestFinance.profit)}
            icon={Wallet}
            iconTone="violet"
            trend={getTrend(latestFinance.profit, previousFinance?.profit)}
            trendLabel="vs mois precedent"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {months.slice(-6).map((currentMonth) => {
            const finance = finances.find((entry) => entry.month === currentMonth);

            return (
              <article
                key={currentMonth}
                className="surface-card rounded-[24px] border border-white/60 p-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                  {currentMonth}
                </h3>
                {finance ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-emerald-600">
                      {formatCompactCurrency(finance.revenue)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Profit {formatCompactCurrency(finance.profit)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(currentMonth);
                      setShowForm(true);
                    }}
                    className="mt-4 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500"
                  >
                    Saisir les donnees
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {showForm ? (
          <FinanceForm month={month || "Nouveau mois"} onClose={() => setShowForm(false)} />
        ) : null}
      </div>
    </Layout>
  );
}
