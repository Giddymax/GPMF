/**
 * Creates a single custom staff login (Auth user + linked `profiles` row)
 * using the service-role key — bypasses RLS at the API layer, so it works
 * even when your Supabase dashboard role can't run DDL/insert directly in
 * the SQL editor.
 *
 * Usage:
 *   npm run create-admin -- --email you@example.com --password "Str0ngPass!" --name "Your Name" [--role admin]
 *
 * --role defaults to "admin" and accepts agent | manager | admin.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local) first.");
  process.exit(1);
}

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const email = getArg("email");
const password = getArg("password");
const fullName = getArg("name");
const role = (getArg("role") ?? "admin") as "agent" | "manager" | "admin";

if (!email || !password || !fullName) {
  console.error(
    'Usage: npm run create-admin -- --email you@example.com --password "Str0ngPass!" --name "Your Name" [--role admin]'
  );
  process.exit(1);
}
if (!["agent", "manager", "admin"].includes(role)) {
  console.error(`Invalid --role "${role}" — must be agent, manager, or admin.`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error(`Failed to create ${email}:`, createError.message);
    process.exit(1);
  }

  const userId = created.user.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: fullName, role });

  if (profileError) {
    console.error(`Auth user created, but the profile insert failed:`, profileError.message);
    console.error(`You can retry just the profile row later — the user id is: ${userId}`);
    process.exit(1);
  }

  console.log(`Created ${role} login for ${email}. Sign in at /admin/login.`);
}

main();
