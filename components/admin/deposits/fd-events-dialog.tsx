"use client";

import * as React from "react";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FdEvent } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";

const EVENT_LABELS: Record<string, string> = {
  early_withdrawal_requested: "Early withdrawal requested",
  early_withdrawal_approved: "Early withdrawal approved & paid",
  early_withdrawal_rejected: "Early withdrawal rejected",
  matured_paid_out: "Matured — paid out",
  rollover_requested: "Rollover requested",
  rollover_completed: "Rollover completed",
  rollover_rejected: "Rollover rejected",
};

export function FdEventsDialog({ fdNumber, events }: { fdNumber: string; events: FdEvent[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} title="View history">
        <History className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{fdNumber} — history</DialogTitle>
          </DialogHeader>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lifecycle events yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-b border-border pb-2 last:border-none last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-GH")}</span>
                  </div>
                  {e.amount !== null ? <p className="text-muted-foreground">{formatGHS(e.amount)}</p> : null}
                  {e.notes ? <p className="text-xs text-muted-foreground">{e.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
