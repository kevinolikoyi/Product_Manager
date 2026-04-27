"use client";

import { useState } from "react";
import { Banknote, Pencil, ReceiptText, Wallet } from "lucide-react";
import KPI from "@/components/dashboard/KPI";
import FinanceForm from "@/components/dashboard/FinanceForm";
import Layout from "@/components/layout/Layout";
import { useCurrentMember, useFinances, usePermissions } from "@/lib/store";
import type { Finance } from "@/lib/types";
import { formatCompactCurrency, formatFinanceMonth } from "@/lib/utils";

export default function FinancePage() {
  const { currentMember } = useCurrentMember();
  const { canManageFinance } = usePermissions();
  const { finances } = useFinances();
  const [showForm, setShowForm] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);

  const latestFinance = finances[finances.length - 1];
  const previousFinance = finances[finances.length - 2];

  const getTrend = (current: number, previous?: number) => {
    if (!previous) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  };

  if (!canManageFinance) {
    return (
      <Layout
        title="Finances"
        eyebrow="Performance"
        description="Acces restreint aux indicateurs financiers et aux saisies mensuelles."
      >
        <article className="surface-card rounded-[30px] border border-white/60 p-6">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
            Acces refuse
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Les finances du workspace sont reservees aux owners et managers. Le profil actif
            {currentMember ? ` ${currentMember.name}` : ""} ne dispose pas de ce niveau
            d&apos;autorisation.
          </p>
        </article>
      </Layout>
    );
  }

  return (
    <Layout
      title="Finances"
      eyebrow="Performance"
      description="Suivi synthetique des revenus, depenses et marge mensuelle."
      actions={
        <button
          type="button"
          onClick={() => {
            setEditingFinance(null);
            setShowForm(true);
          }}
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
            value={formatCompactCurrency(latestFinance?.revenue ?? 0)}
            icon={Banknote}
            iconTone="emerald"
            trend={getTrend(latestFinance?.revenue ?? 0, previousFinance?.revenue)}
            trendLabel="vs mois precedent"
          />
          <KPI
            title="Depenses"
            value={formatCompactCurrency(latestFinance?.expenses ?? 0)}
            icon={ReceiptText}
            iconTone="red"
            trend={getTrend(latestFinance?.expenses ?? 0, previousFinance?.expenses)}
            trendLabel="vs mois precedent"
          />
          <KPI
            title="Profit"
            value={formatCompactCurrency(latestFinance?.profit ?? 0)}
            icon={Wallet}
            iconTone="violet"
            trend={getTrend(latestFinance?.profit ?? 0, previousFinance?.profit)}
            trendLabel="vs mois precedent"
          />
        </div>

        {finances.length === 0 ? (
          <article className="surface-card rounded-[24px] border border-white/60 p-6">
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
              Aucun historique financier
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Les donnees mensuelles seront chargees depuis Supabase des qu&apos;une premiere
              periode sera saisie.
            </p>
          </article>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...finances].reverse().map((finance) => (
              <article
                key={finance.id}
                className="surface-card rounded-[24px] border border-white/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                    {formatFinanceMonth(finance.periodStart)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFinance(finance);
                      setShowForm(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-emerald-600">
                    {formatCompactCurrency(finance.revenue)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Depenses {formatCompactCurrency(finance.expenses)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Profit {formatCompactCurrency(finance.profit)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {showForm ? (
          <FinanceForm
            finance={editingFinance}
            onClose={() => {
              setShowForm(false);
              setEditingFinance(null);
            }}
          />
        ) : null}
      </div>
    </Layout>
  );
}
