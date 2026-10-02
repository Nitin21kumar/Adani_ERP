import { cn } from "@/utils/cn";
import type { VerificationStatus } from "@/types/audit";

const styleMap: Record<VerificationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted_to_mis: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  returned_for_correction: "bg-destructive/10 text-destructive",
  mis_approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  closed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const labelMap: Record<VerificationStatus, string> = {
  draft: "Draft",
  submitted_to_mis: "Submitted to MIS",
  returned_for_correction: "Returned for Correction",
  mis_approved: "MIS Approved",
  closed: "Closed",
};

export default function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", styleMap[status])}>
      {labelMap[status]}
    </span>
  );
}
