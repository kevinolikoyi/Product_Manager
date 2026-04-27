"use client";

import Link from "next/link";
import { AlertTriangle, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { navigationItems } from "./navigation";
import { canAccessRoute, hasMinimumRole } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  useAuthenticatedSession,
  useCurrentMember,
  useBackendStatus,
  useMembers,
  useProjects,
  useTasks,
} from "@/lib/store";

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
  const { currentMember, currentRole, currentRoleLabel } = useCurrentMember();
  const { authenticatedEmail } = useAuthenticatedSession();
  const backendStatus = useBackendStatus();
  const { members } = useMembers();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const mainItems = navigationItems
    .filter((item) => item.section === "navigation")
    .filter((item) =>
      members.length === 0 ? true : canAccessRoute(currentRole, item.href),
    );
  const settingsItems = navigationItems
    .filter((item) => item.section === "settings")
    .filter((item) =>
      item.minimumRole ? hasMinimumRole(currentRole, item.minimumRole) : true,
    );

  const roleTone =
    currentMember?.role === "owner"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : currentMember?.role === "manager"
        ? "border-sky-400/20 bg-sky-500/10 text-sky-200"
        : "border-amber-400/20 bg-amber-500/10 text-amber-200";

  const initials =
    currentMember?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ??
    "NA";

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

          {settingsItems.length > 0 ? (
            <div className="space-y-1.5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Administration
              </p>
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.label}
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
                  </Link>
                );
              })}
            </div>
          ) : null}

          {!backendStatus.loading && members.length > 0 && !currentMember ? (
            <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Compte non rattache</p>
                  <p className="mt-1 text-amber-100/80">
                    La session active ne correspond a aucun collaborateur du workspace.
                    Verifie l&apos;e-mail du compte dans Supabase Auth et dans
                    `public.collaborators`.
                  </p>
                  {authenticatedEmail ? (
                    <p className="mt-2 break-all text-amber-50">
                      E-mail detecte : {authenticatedEmail}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </nav>

        {currentMember ? (
          <div className="border-t border-white/8 p-3">
            <div className="rounded-[26px] bg-white/5 p-3">
              <div
                className={cn(
                  "flex items-center gap-3",
                  compactDesktop && "md:justify-center",
                )}
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                  {initials || "NA"}
                </div>
                <div className={cn("min-w-0 flex-1", compactDesktop && "md:hidden")}>
                  <p className="truncate text-sm font-medium text-slate-100">
                    {currentMember.name}
                  </p>
                  {currentRoleLabel ? (
                    <span
                      className={cn(
                        "mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        roleTone,
                      )}
                    >
                      {currentRoleLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <form action={logout} className="mt-3">
                <Button
                  type="submit"
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
                    compactDesktop && "md:px-0",
                  )}
                >
                  <LogOut className={cn("h-4 w-4", !compactDesktop && "mr-2")} />
                  <span className={cn(compactDesktop && "md:hidden")}>
                    Se déconnecter
                  </span>
                </Button>
              </form>
            </div>
          </div>
        ) : !backendStatus.loading ? (
          <div className="border-t border-white/8 p-3">
            <div className="rounded-[26px] bg-white/5 p-3">
              <p className="text-sm font-medium text-slate-100">Session active</p>
              <p className="mt-1 text-xs text-slate-400">
                Aucune fiche collaborateur correspondante n&apos;a ete trouvee.
              </p>
              {authenticatedEmail ? (
                <p className="mt-2 break-all text-xs text-slate-300">
                  E-mail detecte : {authenticatedEmail}
                </p>
              ) : null}
              <form action={logout} className="mt-3">
                <Button
                  type="submit"
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
                    compactDesktop && "md:px-0",
                  )}
                >
                  <LogOut className={cn("h-4 w-4", !compactDesktop && "mr-2")} />
                  <span className={cn(compactDesktop && "md:hidden")}>
                    Se deconnecter
                  </span>
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
