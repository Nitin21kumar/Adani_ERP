import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  total: number;
  limit: number;
  skip: number;
  onSkipChange: (skip: number) => void;
}

export default function Pagination({ total, limit, skip, onSkipChange }: PaginationProps) {
  if (total <= limit) return null;
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm text-muted-foreground">
      <span>
        Showing {Math.min(skip + 1, total)}–{Math.min(skip + limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={skip === 0} onClick={() => onSkipChange(Math.max(0, skip - limit))}>
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" disabled={skip + limit >= total} onClick={() => onSkipChange(skip + limit)}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
