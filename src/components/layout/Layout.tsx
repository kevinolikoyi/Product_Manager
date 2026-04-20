"use client";

import { useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

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

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col px-3 py-3 sm:px-4">
          <Navbar
            title={title}
            description={description}
            eyebrow={eyebrow}
            actions={actions}
            onMenuToggle={() => setMobileOpen((current) => !current)}
          />
          <main className="min-w-0 flex-1 px-1 pb-6 pt-5 sm:px-2 lg:pt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
