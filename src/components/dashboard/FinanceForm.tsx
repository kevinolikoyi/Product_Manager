"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useFinances } from "@/lib/store";
import type { Finance } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  formatFinanceMonth,
  getCurrentMonthInputValue,
  monthInputToPeriodStart,
  periodStartToMonthInput,
} from "@/lib/utils";

interface FinanceFormProps {
  onClose: () => void;
  finance?: Finance | null;
}

export default function FinanceForm({ onClose, finance = null }: FinanceFormProps) {
  const { finances, saveFinance } = useFinances();
  const [month, setMonth] = useState(
    finance ? periodStartToMonthInput(finance.periodStart) : getCurrentMonthInputValue(),
  );
  const [revenue, setRevenue] = useState(finance ? String(finance.revenue) : "");
  const [expenses, setExpenses] = useState(finance ? String(finance.expenses) : "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedPeriodStart = useMemo(() => monthInputToPeriodStart(month), [month]);
  const existingFinance = useMemo(
    () => finances.find((entry) => entry.periodStart === selectedPeriodStart),
    [finances, selectedPeriodStart],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedPeriodStart) {
      setSubmitError("Le mois est requis.");
      return;
    }

    if (existingFinance && existingFinance.id !== finance?.id) {
      setSubmitError("Une ligne financiere existe deja pour ce mois.");
      return;
    }

    const newFinance: Finance = {
      id: finance?.id ?? crypto.randomUUID(),
      periodStart: selectedPeriodStart,
      revenue: Number.parseInt(revenue, 10) || 0,
      expenses: Number.parseInt(expenses, 10) || 0,
      profit: (Number.parseInt(revenue, 10) || 0) - (Number.parseInt(expenses, 10) || 0),
    };

    try {
      setIsSaving(true);
      setSubmitError(null);
      await saveFinance(newFinance);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Enregistrement impossible pour cette periode.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const title = finance
    ? `Modifier finances ${formatFinanceMonth(finance.periodStart)}`
    : `Saisir finances ${selectedPeriodStart ? formatFinanceMonth(selectedPeriodStart) : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mois</label>
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Chiffre d&apos;affaires (FCFA)
            </label>
            <Input
              type="number"
              value={revenue}
              onChange={(event) => setRevenue(event.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Depenses (FCFA)
            </label>
            <Input
              type="number"
              value={expenses}
              onChange={(event) => setExpenses(event.target.value)}
              placeholder="0"
              required
            />
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
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
