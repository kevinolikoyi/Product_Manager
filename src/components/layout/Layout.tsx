"use client";

import { useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import { useWorkspacePreferences } from "@/lib/store";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export default function Layout({
  children,
  title,
  description,
  eyebrow,
  actions,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { preferences } = useWorkspacePreferences();

  const compactDesktopSidebar = preferences.desktopSidebar === "compact";
  const compactDensity = preferences.density === "compact";
  const isFluidWidth = preferences.contentWidth === "fluid";
  const contentWidthClass = isFluidWidth ? "max-w-none" : "max-w-[1280px]";

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar
          compactDesktop={compactDesktopSidebar}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "flex min-h-screen min-w-0 flex-1 flex-col",
            compactDensity ? "px-2 py-2 sm:px-3" : "px-3 py-3 sm:px-4",
          )}
        >
          <Navbar
            title={title}
            description={description}
            eyebrow={eyebrow}
            actions={actions}
            onMenuToggle={() => setMobileOpen((current) => !current)}
          />
          <main
            className={cn(
              "min-w-0 flex-1 pb-6",
              compactDensity ? "px-0 pt-4 sm:px-1 lg:pt-5" : "px-1 pt-5 sm:px-2 lg:pt-6",
            )}
          >
            <div className={cn("w-full", !isFluidWidth && "mx-auto", contentWidthClass)}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
