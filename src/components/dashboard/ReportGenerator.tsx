"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { CalendarRange, Download } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFinances, useProjects, useTasks } from "@/lib/store";
import {
  formatCompactCurrency,
  formatFullDate,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskBlocked,
  isTaskOverdue,
  priorityLabels,
  projectStatusLabels,
  riskLabels,
  statusLabels,
} from "@/lib/utils";

const frenchMonthIndex: Record<string, number> = {
  jan: 0,
  fev: 1,
  feb: 1,
  mar: 2,
  avr: 3,
  apr: 3,
  mai: 4,
  may: 4,
  jun: 5,
  juin: 5,
  jul: 6,
  juil: 6,
  aou: 7,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

type Preset = "current_month" | "last_7_days" | "last_30_days";

function toIsoDate(value: Date) {
  return value.toISOString().split("T")[0];
}

function getCurrentMonthStartIso() {
  const today = new Date();
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

function shiftDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function parseFinanceMonth(monthLabel: string) {
  const [rawMonth, rawYear] = monthLabel.trim().split(/\s+/);
  const year = Number.parseInt(rawYear ?? "", 10);

  if (!rawMonth || Number.isNaN(year)) {
    return null;
  }

  const normalizedMonth = rawMonth
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const monthIndex = frenchMonthIndex[normalizedMonth];

  if (monthIndex === undefined) {
    return null;
  }

  return new Date(year, monthIndex, 1);
}

function buildPeriodLabel(startDate: string, endDate: string) {
  return `${formatFullDate(startDate)} au ${formatFullDate(endDate)}`;
}

function createFilename(startDate: string, endDate: string) {
  return `rapport-as-world-tech-${startDate}_${endDate}.pdf`;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 16, y);
  return y + 8;
}

function ensurePageSpace(doc: jsPDF, y: number, requiredHeight = 16) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + requiredHeight <= pageHeight - 14) {
    return y;
  }

  doc.addPage();
  return 18;
}

function drawTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 32;
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const scale = usableWidth / totalWidth;
  const scaledWidths = columnWidths.map((width) => width * scale);
  const left = 16;
  const baseLineHeight = 5;

  const drawHeader = (headerY: number) => {
    let x = left;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    headers.forEach((header, index) => {
      const width = scaledWidths[index];
      doc.rect(x, headerY, width, 9, "FD");
      doc.text(header, x + 2, headerY + 5.8);
      x += width;
    });

    return headerY + 9;
  };

  y = ensurePageSpace(doc, y, 20);
  y = drawHeader(y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.7);

  rows.forEach((row) => {
    const cellLines = row.map((cell, index) =>
      doc.splitTextToSize(cell, Math.max(scaledWidths[index] - 4, 12)),
    );
    const rowHeight =
      Math.max(...cellLines.map((lines) => Math.max(lines.length, 1))) * baseLineHeight + 4;

    y = ensurePageSpace(doc, y, rowHeight + 4);

    if (y === 18) {
      y = drawHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.7);
    }

    let x = left;
    cellLines.forEach((lines, index) => {
      const width = scaledWidths[index];
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, y, width, rowHeight);
      doc.text(lines, x + 2, y + 4.5);
      x += width;
    });

    y += rowHeight;
  });

  return y;
}

export default function ReportGenerator() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { finances } = useFinances();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(getCurrentMonthStartIso);
  const [endDate, setEndDate] = useState(getTodayIsoDate);
  const [selectedPreset, setSelectedPreset] = useState<Preset>("current_month");

  const isPeriodInvalid = startDate > endDate;
  const today = getTodayIsoDate();

  const preview = useMemo(() => {
    const tasksInPeriod = tasks.filter(
      (task) => task.dueDate >= startDate && task.dueDate <= endDate,
    );
    const projectNames = new Set(tasksInPeriod.map((task) => task.project));
    const impactedProjects = projects.filter((project) => projectNames.has(project.name));
    const financesInPeriod = finances.filter((finance) => {
      const monthDate = parseFinanceMonth(finance.month);
      if (!monthDate) {
        return false;
      }

      const financeIso = toIsoDate(monthDate);
      return financeIso >= startDate && financeIso <= endDate;
    });

    return {
      tasksInPeriod,
      impactedProjects,
      financesInPeriod,
    };
  }, [endDate, finances, projects, startDate, tasks]);

  const applyPreset = (preset: Preset) => {
    const currentDate = getTodayIsoDate();

    setSelectedPreset(preset);

    if (preset === "current_month") {
      setStartDate(getCurrentMonthStartIso());
      setEndDate(currentDate);
      return;
    }

    if (preset === "last_7_days") {
      setStartDate(shiftDays(currentDate, -6));
      setEndDate(currentDate);
      return;
    }

    setStartDate(shiftDays(currentDate, -29));
    setEndDate(currentDate);
  };

  const handleStartDateChange = (value: string) => {
    setSelectedPreset("current_month");
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setSelectedPreset("current_month");
    setEndDate(value);
  };

  const generateReport = async () => {
    if (isPeriodInvalid) {
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const tasksInPeriod = [...preview.tasksInPeriod].sort(
        (left, right) =>
          getTaskPriorityScore(right, endDate) - getTaskPriorityScore(left, endDate),
      );
      const impactedProjects = [...preview.impactedProjects].sort(
        (left, right) => right.progress - left.progress,
      );
      const financesInPeriod = preview.financesInPeriod;

      const overdueTasks = tasksInPeriod.filter((task) => isTaskOverdue(task, endDate));
      const blockedTasks = tasksInPeriod.filter((task) => isTaskBlocked(task));
      const completedTasks = tasksInPeriod.filter((task) => task.status === "done");
      const activeProjects = impactedProjects.filter((project) => project.status === "active");
      const revenueTotal = financesInPeriod.reduce((sum, finance) => sum + finance.revenue, 0);
      const expenseTotal = financesInPeriod.reduce((sum, finance) => sum + finance.expenses, 0);
      const profitTotal = financesInPeriod.reduce((sum, finance) => sum + finance.profit, 0);

      let y = 18;

      doc.setFillColor(79, 70, 229);
      doc.roundedRect(14, 12, 182, 28, 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Rapport global AS WORLD TECH", 18, 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Periode analysee : ${buildPeriodLabel(startDate, endDate)}`, 18, 31);
      doc.text(`Genere le ${formatFullDate(today)}`, 18, 36);

      doc.setTextColor(15, 23, 42);
      y = 50;
      y = addSectionTitle(doc, "Synthese executive", y);
      y = drawTable(
        doc,
        y,
        ["Indicateur", "Valeur"],
        [
          ["Taches suivies", String(tasksInPeriod.length)],
          ["Taches terminees", String(completedTasks.length)],
          ["Taches en retard", String(overdueTasks.length)],
          ["Taches bloquees", String(blockedTasks.length)],
          ["Projets concernes", String(impactedProjects.length)],
          ["Projets actifs", String(activeProjects.length)],
          [
            "Taux de completion",
            `${tasksInPeriod.length ? Math.round((completedTasks.length / tasksInPeriod.length) * 100) : 0}%`,
          ],
        ],
        [72, 104],
      );

      y = ensurePageSpace(doc, y + 4, 34);
      y = addSectionTitle(doc, "Finances sur la periode", y + 4);
      if (financesInPeriod.length === 0) {
        y = drawTable(
          doc,
          y,
          ["Information", "Detail"],
          [[
            "Disponibilite",
            "Aucune entree financiere n'est disponible dans l'intervalle choisi.",
          ]],
          [52, 124],
        );
      } else {
        y = drawTable(
          doc,
          y,
          ["Mesure", "Valeur"],
          [
            ["Revenus", formatCompactCurrency(revenueTotal)],
            ["Depenses", formatCompactCurrency(expenseTotal)],
            ["Resultat net", formatCompactCurrency(profitTotal)],
          ],
          [72, 104],
        );
        y = ensurePageSpace(doc, y + 4, 28);
        y = drawTable(
          doc,
          y,
          ["Mois", "Revenus", "Depenses", "Resultat"],
          financesInPeriod.map((finance) => [
            finance.month,
            formatCompactCurrency(finance.revenue),
            formatCompactCurrency(finance.expenses),
            formatCompactCurrency(finance.profit),
          ]),
          [42, 44, 44, 46],
        );
      }

      y = ensurePageSpace(doc, y + 4, 40);
      y = addSectionTitle(doc, "Taches prioritaires", y + 4);
      if (tasksInPeriod.length === 0) {
        y = drawTable(
          doc,
          y,
          ["Information", "Detail"],
          [["Disponibilite", "Aucune tache ne tombe sur la plage selectionnee."]],
          [52, 124],
        );
      } else {
        y = drawTable(
          doc,
          y,
          ["Tache", "Projet", "Statut", "Priorite", "Echeance"],
          tasksInPeriod.slice(0, 8).map((task) => [
            task.title,
            task.project,
            `${statusLabels[task.status]} / ${riskLabels[task.risk]}`,
            priorityLabels[task.priority],
            formatFullDate(task.dueDate),
          ]),
          [56, 38, 32, 22, 28],
        );
      }

      y = ensurePageSpace(doc, y + 4, 36);
      y = addSectionTitle(doc, "Projets concernes", y + 4);
      if (impactedProjects.length === 0) {
        y = drawTable(
          doc,
          y,
          ["Information", "Detail"],
          [["Disponibilite", "Aucun projet n'est rattache a la periode selectionnee."]],
          [52, 124],
        );
      } else {
        y = drawTable(
          doc,
          y,
          ["Projet", "Statut", "Progression", "Volume"],
          impactedProjects.map((project) => [
            project.name,
            projectStatusLabels[project.status],
            `${project.progress}%`,
            `${project.numberOfTasks} taches`,
          ]),
          [76, 34, 26, 40],
        );
      }

      doc.save(createFilename(startDate, endDate));
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="rounded-full border-slate-200/80 bg-white/85 text-slate-700 hover:bg-white"
      >
        <CalendarRange className="mr-1.5 h-4 w-4 text-slate-400" />
        Rapport PDF
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Exporter un rapport global"
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">
              Periode par defaut
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Le rapport est initialise sur le mois en cours, du{" "}
              {formatFullDate(startDate)} au {formatFullDate(endDate)}.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
              Raccourcis
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "current_month", label: "Mois en cours" },
                { id: "last_7_days", label: "7 derniers jours" },
                { id: "last_30_days", label: "30 derniers jours" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id as Preset)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedPreset === preset.id
                      ? "bg-indigo-600 text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]"
                      : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Date de debut
              </span>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
                max={endDate}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Date de fin
              </span>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => handleEndDateChange(event.target.value)}
                min={startDate}
                max={today}
              />
            </label>
          </div>

          {isPeriodInvalid ? (
            <p className="text-sm font-medium text-red-600">
              La date de debut doit etre anterieure ou egale a la date de fin.
            </p>
          ) : null}

          <div className="grid gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Taches
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {preview.tasksInPeriod.length}
              </p>
              <p className="text-sm text-slate-500">dans la plage</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Projets
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {preview.impactedProjects.length}
              </p>
              <p className="text-sm text-slate-500">concernes</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Finances
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {preview.financesInPeriod.length}
              </p>
              <p className="text-sm text-slate-500">mois inclus</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={generateReport}
              disabled={isPeriodInvalid || isGenerating}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {isGenerating ? "Generation..." : "Telecharger le PDF"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
