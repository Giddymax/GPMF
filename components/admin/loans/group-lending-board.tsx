"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupDisbursementGate, type GroupMemberStatus } from "@/lib/finance";
import type { GroupWithRoster } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import { disburseGroupTranche } from "@/app/admin/(dashboard)/operations/loans/actions";

const STATUS_VARIANT: Record<GroupMemberStatus, "muted" | "gold" | "emerald" | "destructive"> = {
  pending: "muted",
  current: "emerald",
  overdue: "destructive",
  defaulted: "destructive",
  completed: "gold",
};

export function GroupLendingBoard({ groups }: { groups: GroupWithRoster[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function disburse(groupId: string) {
    setPending(groupId);
    const result = await disburseGroupTranche(groupId, 400, 4);
    setPending(null);
    if (result.ok) {
      toast.success("Tranche disbursed.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not disburse tranche.");
    }
  }

  if (groups.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No lending groups yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups.map((group) => {
        const statuses = group.members.map((m) => m.status);
        const gate =
          statuses.length === 5 ? groupDisbursementGate(statuses) : { activeTrancheIndex: null, blocked: true, pendingInActiveTranche: 0, reason: "Needs 5 members" };

        return (
          <Card key={group.id} className="border-white/10 bg-navy-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">{group.name}</CardTitle>
              <span className="text-xs text-white/50">Collateral: {formatGHS(group.collateral_balance)}</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">
                      {member.client_name} <span className="text-white/40">· tranche {member.tranche_index + 1}</span>
                    </span>
                    <Badge variant={STATUS_VARIANT[member.status]} className="capitalize">{member.status}</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                {gate.blocked
                  ? gate.reason || "Blocked"
                  : gate.activeTrancheIndex !== null
                  ? `Tranche ${gate.activeTrancheIndex + 1} ready — ${gate.pendingInActiveTranche} member(s) pending disbursement.`
                  : "All tranches disbursed."}
              </div>

              {!gate.blocked && gate.activeTrancheIndex !== null && gate.pendingInActiveTranche > 0 ? (
                <Button size="sm" className="mt-3" disabled={pending === group.id} onClick={() => disburse(group.id)}>
                  Disburse next tranche
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
