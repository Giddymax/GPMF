"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Agent } from "@/lib/supabase/types";
import { cn, formatGHS } from "@/lib/utils";
import { reconcileCashSession } from "@/app/admin/(dashboard)/operations/susu/actions";

export function CashUp({
  agents,
  expectedByAgent,
}: {
  agents: Agent[];
  expectedByAgent: Record<string, number>;
}) {
  const router = useRouter();
  const [declared, setDeclared] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState<string | null>(null);

  async function submit(agentId: string) {
    const value = Number(declared[agentId] ?? 0);
    setPending(agentId);
    const result = await reconcileCashSession(agentId, value);
    setPending(null);
    if (result.ok) {
      toast.success("Cash session reconciled.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not reconcile.");
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Agent</TableHead>
          <TableHead className="text-white/50">Expected cash</TableHead>
          <TableHead className="text-white/50">Declared cash</TableHead>
          <TableHead className="text-white/50">Variance</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => {
          const expected = expectedByAgent[agent.id] ?? 0;
          const declaredValue = declared[agent.id] !== undefined ? Number(declared[agent.id]) : expected;
          const variance = declaredValue - expected;
          return (
            <TableRow key={agent.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-white">{agent.full_name} <span className="text-white/40">({agent.employee_code})</span></TableCell>
              <TableCell className="text-white/70">{formatGHS(expected)}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="w-32"
                  placeholder={String(expected)}
                  value={declared[agent.id] ?? ""}
                  onChange={(e) => setDeclared((d) => ({ ...d, [agent.id]: e.target.value }))}
                />
              </TableCell>
              <TableCell className={cn("font-medium", variance === 0 ? "text-white/50" : variance > 0 ? "text-emerald-500" : "text-danger-500")}>
                {formatGHS(variance)}
              </TableCell>
              <TableCell>
                <Button size="sm" disabled={pending === agent.id} onClick={() => submit(agent.id)}>
                  Reconcile
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
