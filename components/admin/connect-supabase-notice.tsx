import { AlertTriangle } from "lucide-react";

export function ConnectSupabaseNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-white">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-500" />
      <p>
        No Supabase project connected yet — this screen is showing an empty state. Set{" "}
        <code className="rounded bg-white/10 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and
        run the migrations in <code className="rounded bg-white/10 px-1 py-0.5 text-xs">supabase/migrations</code>{" "}
        (see README) to see real data here.
      </p>
    </div>
  );
}
