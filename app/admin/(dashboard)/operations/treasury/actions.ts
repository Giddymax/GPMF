"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function placeTreasuryFunds(principal: number, annualRate: number, termDays: number): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (principal <= 0) return { ok: false, error: "Enter a principal greater than zero." };

  const supabase = createAdminClient();
  const placedDate = new Date();
  const maturityDate = new Date(placedDate);
  maturityDate.setDate(maturityDate.getDate() + termDays);

  const { data: placement, error } = await supabase
    .from("treasury_placements")
    .insert({
      principal,
      annual_rate: annualRate,
      placed_date: placedDate.toISOString().slice(0, 10),
      maturity_date: maturityDate.toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error || !placement) return { ok: false, error: "Could not create the placement." };

  const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "T-bill placement",
    p_reference_type: "treasury_placement",
    p_reference_id: placement.id,
    p_legs: [
      { gl_code: "TBILL", debit: principal },
      { gl_code: "BANK", credit: principal },
    ],
    p_created_by: session.userId,
  });
  if (postError) return { ok: false, error: "Placement created but the ledger post failed." };

  await supabase.from("treasury_placements").update({ ledger_transaction_id: txnId }).eq("id", placement.id);

  revalidatePath("/admin/operations/treasury");
  return { ok: true };
}

export async function matureTreasuryPlacement(id: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: placement } = await supabase.from("treasury_placements").select("*").eq("id", id).single();
  if (!placement) return { ok: false, error: "Placement not found." };

  const interest = Number(
    (placement.principal * placement.annual_rate * (Math.round((new Date(placement.maturity_date).getTime() - new Date(placement.placed_date).getTime()) / 86400000) / 365)).toFixed(2)
  );

  const { error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "T-bill maturity",
    p_reference_type: "treasury_income",
    p_reference_id: id,
    p_legs: [
      { gl_code: "BANK", debit: placement.principal + interest },
      { gl_code: "TBILL", credit: placement.principal },
      { gl_code: "INT_INCOME", credit: interest, flow_category: "treasury_income" },
    ],
    p_created_by: session.userId,
  });
  if (postError) return { ok: false, error: "Could not mature the placement." };

  await supabase.from("treasury_placements").update({ status: "matured" }).eq("id", id);
  revalidatePath("/admin/operations/treasury");
  return { ok: true };
}
