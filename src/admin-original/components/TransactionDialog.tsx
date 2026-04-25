import type { UserTransaction } from "@/admin-original/data/users";
import { inferAreaFromPoint } from "@/admin-original/data/areas";
import { X, Receipt, Store, MapPin, Calendar, CreditCard, Hash, CheckCircle2, RotateCcw } from "lucide-react";

interface Props {
  txn: (UserTransaction & { userName?: string }) | null;
  onClose: () => void;
}

export const TransactionDialog = ({ txn, onClose }: Props) => {
  if (!txn) return null;
  const date = new Date(txn.timestamp);
  const area = inferAreaFromPoint(txn.region, txn.lon, txn.lat);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] max-w-[92vw] rounded-2xl bg-card shadow-elevated border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </div>
            <div className="mt-1 text-3xl font-bold text-foreground tabular-nums">
              RM {txn.amount.toFixed(2)}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                {txn.category}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  txn.status === "completed"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {txn.status === "completed" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                {txn.status}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 rounded-lg border border-border bg-secondary/50 p-3.5">
            {txn.userName && (
              <Row icon={Receipt} label="User" value={`${txn.userName} Â· ${txn.userId}`} />
            )}
            <Row icon={Store} label="Merchant" value={txn.merchant} />
            <Row icon={MapPin} label="Region" value={txn.region} mono={false} />
            <Row icon={MapPin} label="Area" value={area ?? "-"} mono={false} />
            <Row icon={Calendar} label="Date" value={date.toLocaleString()} />
            <Row icon={CreditCard} label="Payment" value={txn.paymentMethod} />
            <Row icon={Hash} label="Reference" value={txn.reference} mono />
          </div>

          <div className="text-[11px] text-center text-muted-foreground tabular-nums">
            Txn ID #{txn.id} Â· GPS {txn.lat.toFixed(3)}, {txn.lon.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
};

function Row({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card border border-border shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`text-sm font-medium text-foreground truncate ${mono ? "tabular-nums" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

