/**
 * One-off cleanup: removes seed/demo data from a live project, keeping
 * exactly one client (GPFS-0001) and the agent assigned to them.
 *
 * Removes:
 *   - Every client except GPFS-0001 (via purge_client(), which also removes
 *     their accounts, susu history, savings transactions, loans, fixed
 *     deposits, and every linked ledger transaction).
 *   - The 2 demo lending groups, their group loans, and linked ledger entries.
 *   - Every demo agent except the one GPFS-0001 is assigned to.
 *   - The 2 demo T-bill treasury placements and their ledger transactions.
 *   - The 5 seeded website applications and 3 seeded inquiries (matched by
 *     their exact seed phone numbers, not a blanket table wipe, in case real
 *     submissions have come in since).
 *
 * Leaves untouched: public site content (news/testimonials/FAQs/team/stats/
 * rates), staff logins, and the equity injection transaction.
 *
 * This is irreversible. Run once: npm run purge:demo
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

function jwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local) first.");
  process.exit(1);
}
if (jwtRole(serviceKey) !== "service_role") {
  console.error("SUPABASE_SERVICE_ROLE_KEY doesn't look right — its JWT role claim isn't service_role.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const KEEP_CLIENT_CODE = "GPFS-0001";
const SEED_APPLICATION_PHONES = ["0201234567", "0207654321", "0244112233", "0244998877", "0201122334"];
const SEED_INQUIRY_PHONES = ["0244555666", "0201998877", "0244221100"];

async function deleteLedgerTransactions(transactionIds: Iterable<string>) {
  for (const id of new Set(transactionIds)) {
    const { error } = await supabase.rpc("admin_delete_ledger_transaction", { p_transaction_id: id });
    if (error) console.error(`  ! Failed to delete ledger transaction ${id}:`, error.message);
  }
}

async function main() {
  console.log(`Connecting to ${url} as service_role...\n`);

  const { data: keepClient, error: keepError } = await supabase
    .from("clients")
    .select("id, agent_id, client_code, full_name")
    .eq("client_code", KEEP_CLIENT_CODE)
    .single();
  if (keepError || !keepClient) {
    console.error(`Could not find ${KEEP_CLIENT_CODE} — aborting so nothing is deleted.`, keepError?.message);
    process.exit(1);
  }
  console.log(`Keeping: ${keepClient.full_name} (${keepClient.client_code})\n`);

  // 1) Every other client.
  const { data: otherClients } = await supabase
    .from("clients")
    .select("id, client_code, full_name")
    .neq("id", keepClient.id);
  console.log(`Purging ${otherClients?.length ?? 0} other client(s)...`);
  for (const c of otherClients ?? []) {
    const { error } = await supabase.rpc("purge_client", { p_client_id: c.id });
    if (error) console.error(`  ! Failed to purge ${c.client_code} (${c.full_name}):`, error.message);
    else console.log(`  - Purged ${c.client_code} (${c.full_name})`);
  }

  // 2) Demo lending groups: their group loans' ledger transactions, the
  //    loans themselves, the group collateral ledger transactions, members,
  //    then the group row.
  const { data: groups } = await supabase.from("groups").select("id, name");
  console.log(`\nPurging ${groups?.length ?? 0} lending group(s)...`);
  for (const g of groups ?? []) {
    const { data: groupLoans } = await supabase.from("loans").select("id").eq("group_id", g.id);
    for (const loan of groupLoans ?? []) {
      const { data: entries } = await supabase.from("ledger_entries").select("transaction_id").eq("loan_id", loan.id);
      await deleteLedgerTransactions((entries ?? []).map((e) => e.transaction_id));
    }
    await supabase.from("loans").delete().eq("group_id", g.id); // cascades loan_schedules/loan_repayments

    const { data: collateralEntries } = await supabase.from("ledger_entries").select("transaction_id").eq("group_id", g.id);
    await deleteLedgerTransactions((collateralEntries ?? []).map((e) => e.transaction_id));

    await supabase.from("group_members").delete().eq("group_id", g.id);
    const { error } = await supabase.from("groups").delete().eq("id", g.id);
    if (error) console.error(`  ! Failed to delete group ${g.name}:`, error.message);
    else console.log(`  - Purged group ${g.name}`);
  }

  // 3) Every demo agent except the one the kept client is assigned to.
  const { data: agents } = await supabase
    .from("agents")
    .select("id, employee_code, full_name")
    .neq("id", keepClient.agent_id ?? "");
  console.log(`\nDeleting ${agents?.length ?? 0} demo agent(s), keeping the one assigned to ${keepClient.client_code}...`);
  for (const a of agents ?? []) {
    const { data: entries } = await supabase.from("ledger_entries").select("transaction_id").eq("agent_id", a.id);
    await deleteLedgerTransactions((entries ?? []).map((e) => e.transaction_id));

    const { error } = await supabase.from("agents").delete().eq("id", a.id);
    if (error) {
      console.error(
        `  ! Could not delete agent ${a.employee_code} (${a.full_name}) — likely still referenced by ` +
          `something (e.g. a cash session from real testing). Left in place:`,
        error.message
      );
    } else {
      console.log(`  - Deleted agent ${a.employee_code} (${a.full_name})`);
    }
  }

  // 4) Demo T-bill treasury placements.
  const { data: treasuryTxns } = await supabase
    .from("ledger_transactions")
    .select("id")
    .in("reference_type", ["treasury_placement", "treasury_income"]);
  console.log(`\nPurging treasury placements (${treasuryTxns?.length ?? 0} ledger transaction(s))...`);
  await deleteLedgerTransactions((treasuryTxns ?? []).map((t) => t.id));
  const { error: treasuryError, count: treasuryCount } = await supabase
    .from("treasury_placements")
    .delete({ count: "exact" })
    .not("id", "is", null);
  if (treasuryError) console.error("  ! Failed to delete treasury placements:", treasuryError.message);
  else console.log(`  - Deleted ${treasuryCount ?? 0} treasury placement(s)`);

  // 5) Seeded website inbox demo entries (matched by exact seed phone numbers).
  const { count: appCount, error: appError } = await supabase
    .from("applications")
    .delete({ count: "exact" })
    .in("phone", SEED_APPLICATION_PHONES);
  if (appError) console.error("\n! Failed to delete demo applications:", appError.message);
  else console.log(`\nDeleted ${appCount ?? 0} demo application(s)`);

  const { count: inqCount, error: inqError } = await supabase
    .from("inquiries")
    .delete({ count: "exact" })
    .in("phone", SEED_INQUIRY_PHONES);
  if (inqError) console.error("! Failed to delete demo inquiries:", inqError.message);
  else console.log(`Deleted ${inqCount ?? 0} demo inquiries(s)`);

  console.log("\nDone. Public site content (news/testimonials/FAQs/team/stats/rates) was left untouched.");
}

main();
