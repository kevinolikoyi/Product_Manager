"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CalendarRange, Menu } from "lucide-react";
import { pageMetadata } from "./navigation";
import { getTodayIsoDate } from "@/lib/utils";

interface NavbarProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  onMenuToggle: () => void;
}

export default function Navbar({
  title,
  description,
  eyebrow,
  actions,
  onMenuToggle,
}: NavbarProps) {
  const pathname = usePathname();
  const fallback = pageMetadata[pathname] ?? {
    title: "AS WORLD TECH",
    description: "Workspace collaboratif et pilotage des operations.",
    eyebrow: "Workspace",
  };

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${getTodayIsoDate()}T00:00:00.000Z`));

  return (
    <header className="surface-panel sticky top-3 z-20 rounded-[28px] border border-white/45 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm md:hidden"
            aria-label="Ouvrir la navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>{eyebrow ?? fallback.eyebrow}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[30px]">
                {title ?? fallback.title}
              </h1>
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                Systeme stable
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-[15px]">
              {description ?? fallback.description}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <span className="capitalize">{monthLabel}</span>
          </div>
          {actions}
        </div>
      </div>
    </header>
  );
}
