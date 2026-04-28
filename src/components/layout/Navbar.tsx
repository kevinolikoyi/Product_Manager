"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Bell, CalendarRange, CheckCheck, Menu } from "lucide-react";
import { pageMetadata } from "./navigation";
import { useNotifications } from "@/lib/store";
import { cn, getTodayIsoDate } from "@/lib/utils";

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
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

  const formatNotificationTime = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((current) => !current)}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950",
                notificationsOpen && "border-indigo-200 text-indigo-700",
              )}
              aria-label="Ouvrir les notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                      Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void markAllAsRead()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Tout lu
                    </button>
                  ) : null}
                </div>

                <div className="max-h-[420px] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Aucune notification
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Les nouvelles assignations apparaitront ici.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          if (!notification.readAt) {
                            void markAsRead(notification.id);
                          }
                        }}
                        className="w-full rounded-[18px] px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                              notification.readAt ? "bg-slate-200" : "bg-indigo-500",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                                {notification.title}
                              </p>
                              <span className="shrink-0 text-[11px] text-slate-400">
                                {formatNotificationTime(notification.createdAt)}
                              </span>
                            </div>
                            {notification.body ? (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {notification.body}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

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
