import { AlertTriangle, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  title: string;
  description: string;
  type: "warning" | "error" | "info";
}

const alertConfig: Record<
  AlertCardProps["type"],
  {
    icon: LucideIcon;
    container: string;
    iconWrap: string;
    title: string;
    description: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    container: "border-amber-200/80 bg-amber-50/90",
    iconWrap: "bg-amber-100 text-amber-700",
    title: "text-amber-900",
    description: "text-amber-700",
  },
  error: {
    icon: ShieldAlert,
    container: "border-red-200/80 bg-red-50/90",
    iconWrap: "bg-red-100 text-red-700",
    title: "text-red-900",
    description: "text-red-700",
  },
  info: {
    icon: AlertTriangle,
    container: "border-sky-200/80 bg-sky-50/90",
    iconWrap: "bg-sky-100 text-sky-700",
    title: "text-sky-900",
    description: "text-sky-700",
  },
};

export default function AlertCard({ title, description, type }: AlertCardProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[22px] border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]",
        config.container,
      )}
    >
      <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", config.iconWrap)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h3 className={cn("text-sm font-semibold tracking-[-0.02em]", config.title)}>
          {title}
        </h3>
        <p className={cn("mt-1 text-sm leading-6", config.description)}>
          {description}
        </p>
      </div>
    </div>
  );
}
