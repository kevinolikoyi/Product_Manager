"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { navigationItems } from "./navigation";
import { cn } from "@/lib/utils";
import { useProjects, useTasks } from "@/lib/store";

interface SidebarProps {
  compactDesktop: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  compactDesktop,
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const mainItems = navigationItems.filter((item) => item.section === "navigation");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-40 flex w-[280px] flex-col overflow-hidden rounded-[28px]",
          "bg-slate-950 text-slate-100 shadow-[0_24px_64px_rgba(15,23,42,0.4)] ring-1 ring-white/10",
          "transition-transform duration-300 md:sticky md:left-0 md:top-3 md:h-[calc(100vh-24px)] md:translate-x-0",
          compactDesktop ? "md:w-[104px]" : "md:w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-[112%]",
        )}
      >
        <div className="border-b border-white/8 px-5 py-5">
          <div
            className={cn(
              "flex items-center gap-3",
              compactDesktop && "md:justify-center",
            )}
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.4)]">
              <div className="grid grid-cols-2 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[5px] bg-white" />
                <span className="h-2.5 w-2.5 rounded-[5px] bg-white/35" />
                <span className="h-2.5 w-2.5 rounded-[5px] bg-white/35" />
                <span className="h-2.5 w-2.5 rounded-[5px] bg-white" />
              </div>
            </div>
            <div className={cn(compactDesktop && "md:hidden")}>
              <p className="text-sm font-semibold tracking-[-0.02em] text-white">
                AS WORLD TECH
              </p>
              <p className="text-xs text-slate-400">Project Management System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Navigation
            </p>
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const badge =
                item.href === "/tasks"
                  ? String(tasks.length)
                  : item.href === "/projects"
                    ? String(projects.filter((project) => project.status === "active").length)
                    : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={compactDesktop ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                    compactDesktop && "md:justify-center md:px-2",
                    isActive
                      ? "bg-indigo-500/18 text-indigo-100"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl border",
                      isActive
                        ? "border-indigo-400/25 bg-indigo-500/20 text-indigo-200"
                        : "border-white/8 bg-white/4 text-slate-500",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className={cn("flex-1 font-medium", compactDesktop && "md:hidden")}>
                    {item.label}
                  </span>
                  {badge && !compactDesktop ? (
                    <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold text-indigo-100">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="rounded-3xl bg-white/4 p-3">
            <div
              className={cn(
                "flex items-center gap-3",
                compactDesktop && "md:justify-center",
              )}
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                AM
              </div>
              <div className={cn("min-w-0 flex-1", compactDesktop && "md:hidden")}>
                <p className="truncate text-sm font-medium text-slate-100">
                  Alice Martin
                </p>
                <p className="text-xs text-slate-400">Responsable operations</p>
              </div>
              <ChevronRight
                className={cn("h-4 w-4 text-slate-500", compactDesktop && "md:hidden")}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
