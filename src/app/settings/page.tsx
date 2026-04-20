"use client";

import type { ComponentType } from "react";
import {
  Eye,
  LayoutPanelLeft,
  MonitorSmartphone,
  PanelLeftClose,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import {
  useWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/store";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border p-4 text-left transition",
        selected
          ? "border-indigo-300 bg-indigo-50/80 shadow-[0_16px_40px_rgba(79,70,229,0.14)]"
          : "border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const { preferences, dispatch } = useWorkspacePreferences();

  const updatePreferences = (payload: Partial<WorkspacePreferences>) => {
    dispatch({ type: "UPDATE_PREFERENCES", payload });
  };

  const configurationActions = (
    <Button
      type="button"
      variant="outline"
      onClick={() => dispatch({ type: "RESET_PREFERENCES" })}
      className="rounded-full"
    >
      Reinitialiser
    </Button>
  );

  return (
    <Layout
      title="Configuration"
      eyebrow="Workspace"
      description="Ajuste la densite, la largeur et la navigation pour mieux exploiter chaque ecran."
      actions={configurationActions}
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-[0_16px_32px_rgba(79,70,229,0.2)]">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Profil d&apos;affichage
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Les preferences sont memorisees dans le navigateur et reappliquees a
                  l&apos;ouverture suivante.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Densite
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {preferences.density === "compact" ? "Compacte" : "Confort"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Navigation
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {preferences.desktopSidebar === "compact" ? "Compacte" : "Etendue"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Largeur
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {preferences.contentWidth === "fluid" ? "Fluide" : "Cadree"}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Panneaux focus
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {preferences.showInsights ? "Affiches" : "Masques"}
                </p>
              </div>
            </div>
          </article>

          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
              Impact ecran
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              La configuration agit surtout sur la lisibilite desktop, mais les vues
              mobiles basculent automatiquement sur des compositions simplifiees.
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Petits ecrans",
                  description: "Navigation tiroir, cartes simplifiees et blocs qui s'empilent.",
                },
                {
                  label: "Ecrans moyens",
                  description: "Grilles resserrees, actions repliees et tableaux scrollables.",
                },
                {
                  label: "Grands ecrans",
                  description: "Sidebar configurable et panneaux secondaires selon ton focus.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4"
                >
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Densite de contenu
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Augmente ou relache les espacements dans les cartes et le shell.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Confort"
                description="Plus d'air entre les blocs, utile pour la lecture et les ecrans tactiles."
                icon={Sparkles}
                selected={preferences.density === "comfortable"}
                onClick={() => updatePreferences({ density: "comfortable" })}
              />
              <OptionCard
                title="Compacte"
                description="Moins de padding dans le shell pour afficher davantage d'information."
                icon={ScanLine}
                selected={preferences.density === "compact"}
                onClick={() => updatePreferences({ density: "compact" })}
              />
            </div>
          </article>

          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <LayoutPanelLeft className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Navigation desktop
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Choisis une sidebar classique ou une version reduite a icones.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Etendue"
                description="Navigation avec labels visibles en permanence sur ordinateur."
                icon={LayoutPanelLeft}
                selected={preferences.desktopSidebar === "expanded"}
                onClick={() => updatePreferences({ desktopSidebar: "expanded" })}
              />
              <OptionCard
                title="Compacte"
                description="Sidebar reduite pour laisser plus de place au contenu principal."
                icon={PanelLeftClose}
                selected={preferences.desktopSidebar === "compact"}
                onClick={() => updatePreferences({ desktopSidebar: "compact" })}
              />
            </div>
          </article>

          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ScanLine className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Largeur de lecture
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cadre le contenu pour un confort editorial ou ouvre-le au maximum.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Cadree"
                description="Zone centrale plus mesuree pour les pages longues et la lecture dense."
                icon={MonitorSmartphone}
                selected={preferences.contentWidth === "focused"}
                onClick={() => updatePreferences({ contentWidth: "focused" })}
              />
              <OptionCard
                title="Fluide"
                description="Utilise toute la largeur disponible, utile sur les grands ecrans."
                icon={ScanLine}
                selected={preferences.contentWidth === "fluid"}
                onClick={() => updatePreferences({ contentWidth: "fluid" })}
              />
            </div>
          </article>

          <article className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Eye className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Panneaux secondaires
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Affiche ou masque les colonnes d&apos;insight sur les pages qui en proposent.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Afficher"
                description="Conserve les panneaux radar, focus et repartition pour l'analyse rapide."
                icon={Eye}
                selected={preferences.showInsights}
                onClick={() => updatePreferences({ showInsights: true })}
              />
              <OptionCard
                title="Masquer"
                description="Donne la priorite a la vue principale quand l'ecran est charge ou etroit."
                icon={PanelLeftClose}
                selected={!preferences.showInsights}
                onClick={() => updatePreferences({ showInsights: false })}
              />
            </div>
          </article>
        </section>

        <section className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Valeurs par defaut
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Profil recommande pour une lecture equilibree sur ordinateur portable.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatch({ type: "RESET_PREFERENCES" })}
            >
              Restaurer le profil recommande
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
