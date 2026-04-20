import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconTone: "emerald" | "red" | "indigo" | "amber" | "sky" | "violet";
  trend?: number;
  trendLabel?: string;
}

const iconToneClass: Record<KPIProps["iconTone"], string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-indigo-100 text-indigo-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
};

export default function KPI({
  title,
  value,
  icon: Icon,
  iconTone,
  trend,
  trendLabel,
}: KPIProps) {
  const isPositive = typeof trend === "number" && trend > 0;
  const isNegative = typeof trend === "number" && trend < 0;
  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <article className="surface-card rounded-[24px] border border-white/60 p-4 sm:p-5">
      <div
        className={cn(
          "mb-4 grid h-11 w-11 place-items-center rounded-2xl",
          iconToneClass[iconTone],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          isPositive
            ? "bg-emerald-50 text-emerald-700"
            : isNegative
              ? "bg-red-50 text-red-700"
              : "bg-slate-100 text-slate-600",
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" />
        <span>
          {typeof trend === "number"
            ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`
            : "Stable"}
        </span>
        {trendLabel ? <span className="text-slate-500">{trendLabel}</span> : null}
      </div>
    </article>
  );
}
