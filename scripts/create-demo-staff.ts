/**
 * Creates real Supabase Auth logins for the demo staff and links them to the
 * `profiles` (and, for agents, `agents`) rows. Run after `supabase db reset`
 * (migrations + supabase/seed.sql) so the AG-001/002/003 agent rows already
 * exist to link against.
 *
 * Usage: npm run seed:staff
 * Prints each login's email + password once — change the passwords immediately.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local) first.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface StaffSeed {
  email: string;
  password: string;
  fullName: string;
  role: "agent" | "manager" | "admin";
  agentEmployeeCode?: string;
}

const staff: StaffSeed[] = [
  { email: "admin@grainypalacefinancial.com", password: "ChangeMe123!", fullName: "Abena Nyarko", role: "admin" },
  { email: "manager@grainypalacefinancial.com", password: "ChangeMe123!", fullName: "Kwesi Amankwah", role: "manager" },
  { email: "agent1@grainypalacefinancial.com", password: "ChangeMe123!", fullName: "Yaw Mensah-Bonsu", role: "agent", agentEmployeeCode: "AG-001" },
  { email: "agent2@grainypalacefinancial.com", password: "ChangeMe123!", fullName: "Abena Owusu-Ansah", role: "agent", agentEmployeeCode: "AG-002" },
  { email: "agent3@grainypalacefinancial.com", password: "ChangeMe123!", fullName: "Kwesi Ababio", role: "agent", agentEmployeeCode: "AG-003" },
];

async function main() {
  for (const person of staff) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: person.email,
      password: person.password,
      email_confirm: true,
    });

    if (createError) {
      console.error(`Failed to create ${person.email}:`, createError.message);
      continue;
    }

    const userId = created.user.id;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, full_name: person.fullName, role: person.role });

    if (profileError) {
      console.error(`Failed to create profile for ${person.email}:`, profileError.message);
      continue;
    }

    if (person.agentEmployeeCode) {
      const { error: agentError } = await supabase
        .from("agents")
        .update({ profile_id: userId })
        .eq("employee_code", person.agentEmployeeCode);

      if (agentError) {
        console.error(`Failed to link agent ${person.agentEmployeeCode}:`, agentError.message);
      }
    }

    console.log(`Created ${person.role.padEnd(7)} ${person.email}  (password: ${person.password})`);
  }

  console.log("\nDone. Change every password before sharing this environment.");
}

main();
