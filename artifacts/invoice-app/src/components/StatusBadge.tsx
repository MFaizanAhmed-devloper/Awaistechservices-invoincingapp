import { Badge } from "@/components/ui/badge";

type Status = "draft" | "sent" | "paid" | "overdue";

export function StatusBadge({ status }: { status: Status }) {
  const variants = {
    draft: "bg-muted text-muted-foreground hover:bg-muted",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100",
  };

  const labels = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue"
  };

  return (
    <Badge variant="outline" className={`font-medium border-0 px-2.5 py-0.5 capitalize ${variants[status]}`}>
      {labels[status]}
    </Badge>
  );
}