import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { NewClientDialog } from "@/components/admin/clients/new-client-dialog";
import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAgents, getClients } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [clients, agents] = await Promise.all([getClients(200, q), getAgents()]);
  const agentById = new Map(agents.map((a) => [a.id, a]));

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white">Clients</h1>
          <p className="mt-1 text-sm text-white/50">{clients.length} client{clients.length === 1 ? "" : "s"}</p>
        </div>
        <NewClientDialog agents={agents} />
      </div>

      <form className="mb-4 flex max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input name="q" defaultValue={q} placeholder="Search name, code or phone…" className="pl-9" />
        </div>
      </form>

      <Card className="border-white/10 bg-navy-800">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Client</TableHead>
              <TableHead className="text-white/50">Code</TableHead>
              <TableHead className="text-white/50">Phone</TableHead>
              <TableHead className="text-white/50">Town</TableHead>
              <TableHead className="text-white/50">Agent</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <Link href={`/admin/operations/clients/${client.id}`} className="font-medium text-white hover:text-gold-500">
                    {client.full_name}
                  </Link>
                </TableCell>
                <TableCell className="text-white/70">{client.client_code}</TableCell>
                <TableCell className="text-white/70">{client.phone}</TableCell>
                <TableCell className="text-white/70">{client.town}</TableCell>
                <TableCell className="text-white/70">
                  {client.agent_id ? agentById.get(client.agent_id)?.full_name ?? "—" : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={client.status === "active" ? "emerald" : "muted"} className="capitalize">
                    {client.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {clients.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">No clients found.</p>
        ) : null}
      </Card>
    </div>
  );
}
