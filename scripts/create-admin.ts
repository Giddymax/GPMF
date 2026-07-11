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
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// dotenv's default `dotenv/config` preload only looks for a file literally
// named `.env` — it does NOT pick up `.env.local` (that's a Next.js-specific
// convention, not something the plain `dotenv` package knows about). Point it
// at `.env.local` explicitly so this script actually reads the same file the
// README tells you to fill in.
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

const serviceKeyRole = jwtRole(serviceKey);
if (serviceKeyRole !== "service_role") {
  console.error(
    `SUPABASE_SERVICE_ROLE_KEY doesn't look right — its JWT "role" claim is "${serviceKeyRole ?? "unreadable"}", expected "service_role".\n` +
      `Double-check you copied the "service_role secret" key (not "anon public") from Supabase → Project Settings → API.`
  );
  process.exit(1);
}

console.log(`Connecting to ${url} as service_role...`);

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const emailArg = getArg("email");
const passwordArg = getArg("password");
const nameArg = getArg("name");
const role = (getArg("role") ?? "admin") as "agent" | "manager" | "admin";

if (!emailArg || !passwordArg || !nameArg) {
  console.error(
    'Usage: npm run create-admin -- --email you@example.com --password "Str0ngPass!" --name "Your Name" [--role admin]'
  );
  process.exit(1);
}
if (!["agent", "manager", "admin"].includes(role)) {
  console.error(`Invalid --role "${role}" — must be agent, manager, or admin.`);
  process.exit(1);
}

// Re-bound as definitely-`string` consts: TypeScript's narrowing from the
// guard above doesn't reliably persist into the async main() closure below.
const email: string = emailArg;
const password: string = passwordArg;
const fullName: string = nameArg;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUserByEmail(targetEmail: string) {
  // supabase-js's admin API has no getUserByEmail — page through listUsers().
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null; // last page
  }
  return null;
}

async function main() {
  let userId: string;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    // Most likely cause: this email already exists (e.g. created earlier by
    // hand in the dashboard). Reset its password instead of failing outright
    // — that's almost always what someone re-running this command wants.
    const existing = await findExistingUserByEmail(email);
    if (!existing) {
      console.error(`Failed to create ${email}:`, createError.message);
      process.exit(1);
    }

    console.log(`${email} already exists in Auth — resetting its password instead of creating a new user.`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      console.error(`Failed to reset password for ${email}:`, updateError.message);
      process.exit(1);
    }
    userId = existing.id;
  } else {
    userId = created.user.id;
  }

  // Upsert, not insert: the profile row may already exist (e.g. from an
  // earlier partial attempt) — update it in place rather than erroring.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role }, { onConflict: "id" });

  if (profileError) {
    console.error(`Auth user is ready, but the profile upsert failed:`, profileError.message);
    console.error(`You can retry just the profile row later — the user id is: ${userId}`);
    process.exit(1);
  }

  console.log(`Ready: ${role} login for ${email} (password set to the one you just passed in). Sign in at /admin/login.`);
}

main();
