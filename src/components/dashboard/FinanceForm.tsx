"use client";

import { useState, type FormEvent } from "react";
import { type Finance } from "@/data/mockFinances";
import { useFinances } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FinanceFormProps {
  onClose: () => void;
  month: string;
}

export default function FinanceForm({ onClose, month }: FinanceFormProps) {
  const { finances, dispatch } = useFinances();
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const newFinance: Finance = {
      id: Date.now().toString(),
      month,
      revenue: Number.parseInt(revenue, 10) || 0,
      expenses: Number.parseInt(expenses, 10) || 0,
      profit: (Number.parseInt(revenue, 10) || 0) - (Number.parseInt(expenses, 10) || 0),
    };

    const updatedFinances = [...finances, newFinance].sort(
      (left, right) => new Date(left.month).getTime() - new Date(right.month).getTime(),
    );

    dispatch({ type: "UPDATE_FINANCES", payload: updatedFinances });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold">Saisir finances {month}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
