import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";

import { PrintCardButton } from "@/components/admin/clients/print-card-button";
import { getAgents, getClientById } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Client card" };

export default async function ClientCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, agents] = await Promise.all([getClientById(id), getAgents()]);
  if (!client) notFound();

  const agent = agents.find((a) => a.id === client.agent_id);

  return (
    <div className="print:bg-white">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/operations/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back to {client.full_name}
        </Link>
        <PrintCardButton />
      </div>

      <div className="flex justify-center print:block">
        {/* CR80 card size (standard ID/membership card): 85.6mm x 54mm */}
        <div
          className="overflow-hidden rounded-xl border border-white/10 bg-gradient-navy text-white shadow-2xl print:rounded-none print:border-black/20 print:shadow-none"
          style={{ width: "85.6mm", height: "54mm" }}
        >
          <div className="flex h-full flex-col p-3">
            <div className="flex items-center gap-1.5">
              <Image src="/brand/icon-192.png" alt="" width={16} height={16} className="h-4 w-4" />
              <span className="font-heading text-[7px] font-semibold uppercase tracking-[0.12em] text-white">
                Grainy Palace Financial Service
              </span>
            </div>

            <div className="mt-2 flex flex-1 gap-2.5">
              <div className="flex h-[22mm] w-[17mm] shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-white/10">
                {client.photo_url ? (
                  <Image
                    src={client.photo_url}
                    alt=""
                    width={64}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="size-5 text-white/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[10px] font-semibold leading-tight text-white">
                  {client.full_name}
                </p>
                <p className="mt-0.5 text-[8px] font-semibold tracking-wide text-gold-500">{client.client_code}</p>
                <div className="mt-1.5 space-y-0.5 text-[6.5px] leading-tight text-white/70">
                  <p>{client.phone}</p>
                  <p>{[client.town, client.region].filter(Boolean).join(", ")}</p>
                  <p>Ghana Card: {client.ghana_card_no}</p>
                  {agent ? <p>Agent: {agent.full_name}</p> : null}
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between border-t border-white/15 pt-1">
              <p className="text-[5.5px] text-white/50">
                Issued {new Date(client.created_at).toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="text-[5.5px] text-white/50">Property of Grainy Palace — if found, please return</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
