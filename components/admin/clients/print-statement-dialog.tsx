"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ClientActivityRow } from "@/lib/data/admin";
import type { Client } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

const TYPE_LABELS: Record<ClientActivityRow["type"], string> = {
  savings: "Savings",
  susu: "Susu contribution",
  loan_repayment: "Loan repayment",
};

function PrintSheet({ client, activity }: { client: Client; activity: ClientActivityRow[] }) {
  return createPortal(
    <div id="print-portal-root" className="hidden print:block">
      <div className="relative overflow-hidden bg-white text-[#051429]" style={{ width: "210mm", minHeight: "297mm", padding: "16mm" }}>
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Image
            src="/brand/icon-1024.png"
            alt=""
            width={720}
            height={720}
            className="opacity-[0.05]"
            style={{ transform: "rotate(-18deg)" }}
          />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b-2 border-[#D4AF37] pb-4">
            <div className="flex items-center gap-3">
              <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="h-10 w-10" />
              <div>
                <p className="font-heading text-[15px] font-semibold leading-tight text-[#051429]">
                  Grainy Palace Financial Service
                </p>
                <p className="text-[9px] text-[#4B5563]">{siteConfig.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-heading text-[13px] font-semibold uppercase tracking-wide text-[#051429]">
                Transaction Statement
              </p>
              <p className="text-[9px] text-[#4B5563]">
                Printed {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#4B5563]">Client</p>
              <p className="text-[12px] font-medium text-[#051429]">{client.full_name}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#4B5563]">Client code</p>
              <p className="text-[12px] font-medium text-[#051429]">{client.client_code}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#4B5563]">Phone</p>
              <p className="text-[12px] font-medium text-[#051429]">{client.phone || "—"}</p>
            </div>
          </div>

          <div className="mb-3 mt-6 flex items-center gap-3">
            <p className="font-heading text-[13px] font-semibold uppercase tracking-wide text-[#051429]">
              Recent Transactions
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent" />
          </div>

          {activity.length === 0 ? (
            <p className="text-[11px] text-[#4B5563]">No transactions recorded.</p>
          ) : (
            <table className="w-full border-collapse text-[10px]" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="border-b border-[#E4E0D6] text-left text-[9px] uppercase tracking-wide text-[#4B5563]">
                  <th className="w-[18%] py-1.5 font-medium">Date</th>
                  <th className="w-[20%] py-1.5 font-medium">Type</th>
                  <th className="py-1.5 font-medium">Description</th>
                  <th className="w-[20%] py-1.5 text-right font-medium">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row, i) => (
                  <tr key={i} className="border-b border-[#F1EFE8]">
                    <td className="py-1.5 align-top">{new Date(row.date).toLocaleDateString("en-GH")}</td>
                    <td className="py-1.5 align-top">{TYPE_LABELS[row.type]}</td>
                    <td className="py-1.5 align-top" style={{ wordWrap: "break-word" }}>
                      {row.description}
                    </td>
                    <td className="py-1.5 text-right align-top font-medium">{formatGHS(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-10 text-center text-[8px] text-[#4B5563]">
            This document contains confidential client information and is intended for internal use only.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PrintStatementDialog({ client, activity }: { client: Client; activity: ClientActivityRow[] }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle("printing-portal", open);
    return () => document.body.classList.remove("printing-portal");
  }, [open]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Printer className="size-4" /> Print statement
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print statement — {client.full_name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {activity.length === 0
              ? "This client has no recorded transactions yet."
              : `Prints the ${activity.length} most recent transactions shown on this page (savings, susu and loan repayments) on a letterheaded A4 statement.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.print()} disabled={activity.length === 0}>
              <Printer className="size-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {open ? <PrintSheet client={client} activity={activity} /> : null}
    </>
  );
}
