import { cn } from "@/utils/cn";

const styleMap: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styleMap[status] || styleMap.cancelled)}>
      {status}
    </span>
  );
}
