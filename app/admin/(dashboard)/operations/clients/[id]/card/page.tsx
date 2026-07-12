import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";

import { PrintCardButton } from "@/components/admin/clients/print-card-button";
import { getAccountBalancesForClient, getAgents, getClientById } from "@/lib/data/admin";
import { PRODUCT_INTEREST_OPTIONS } from "@/lib/validation/client";
import { formatGHS } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Client profile sheet" };

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-[#4B5563]">{label}</p>
      <p className="text-[12px] font-medium text-[#051429]">{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3 first:mt-0">
      <p className="font-heading text-[13px] font-semibold uppercase tracking-wide text-[#051429]">{children}</p>
      <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent" />
    </div>
  );
}

export default async function ClientCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, agents, balances] = await Promise.all([
    getClientById(id),
    getAgents(),
    getAccountBalancesForClient(id),
  ]);
  if (!client) notFound();

  const agent = agents.find((a) => a.id === client.agent_id);
  const savings = balances.find((b) => b.account_type === "savings");
  const susu = balances.find((b) => b.account_type === "susu");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/operations/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back to {client.full_name}
        </Link>
        <PrintCardButton />
      </div>

      {/* A4 profile sheet. Always rendered light/print-styled, regardless of
          the admin portal's dark theme, so the on-screen preview matches
          what actually prints. */}
      <div className="mx-auto flex justify-center print:block">
        <div
          className="relative overflow-hidden bg-white text-[#051429] shadow-2xl print:shadow-none"
          style={{ width: "210mm", minHeight: "297mm", padding: "16mm" }}
        >
          {/* Watermark */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <Image
              src="/brand/icon-1024.png"
              alt=""
              width={720}
              height={720}
              className="opacity-[0.05]"
              style={{ transform: "rotate(-18deg)" }}
            />
          </div>

          <div className="relative">
            {/* Letterhead */}
            <div className="flex items-center justify-between border-b-2 border-[#D4AF37] pb-4">
              <div className="flex items-center gap-3">
                <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="h-10 w-10" />
                <div>
                  <p className="font-heading text-[15px] font-semibold leading-tight text-[#051429]">
                    Grainy Palace Financial Service
                  </p>
                  <p className="text-[9px] text-[#4B5563]">{siteConfig.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-[13px] font-semibold uppercase tracking-wide text-[#051429]">
                  Client Profile
                </p>
                <p className="text-[9px] text-[#4B5563]">
                  Printed {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Identity block */}
            <div className="mt-6 flex items-center gap-5">
              <div className="flex size-[24mm] shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E4E0D6] bg-[#FAFAF7]">
                {client.photo_url ? (
                  <Image src={client.photo_url} alt="" width={480} height={480} quality={100} className="h-full w-full object-cover" />
                ) : (
                  <User className="size-8 text-[#4B5563]" />
                )}
              </div>
              <div>
                <p className="font-heading text-[20px] font-semibold text-[#051429]">{client.full_name}</p>
                <p className="mt-0.5 text-[12px] font-semibold tracking-wide text-[#8A6623]">{client.client_code}</p>
                <p className="mt-1 text-[10px] capitalize text-[#4B5563]">Status: {client.status}</p>
              </div>
            </div>

            <SectionTitle>Personal Information</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Phone" value={client.phone} />
              <Field label="Email" value={client.email} />
              <Field
                label="Date of birth"
                value={client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString("en-GH") : null}
              />
              <Field label="Gender" value={client.gender ? client.gender[0].toUpperCase() + client.gender.slice(1) : null} />
              <Field label="Occupation" value={client.occupation} />
            </div>

            <SectionTitle>Identification</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Ghana Card number" value={client.ghana_card_no} />
            </div>

            <SectionTitle>Location</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Town" value={client.town} />
              <Field label="Area / suburb" value={client.area} />
              <Field label="Region" value={client.region} />
              <Field label="Digital / GPS address" value={client.digital_address} />
            </div>

            <SectionTitle>Next of Kin</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Full name" value={client.next_of_kin_name} />
              <Field label="Relationship" value={client.next_of_kin_relationship} />
              <Field label="Phone" value={client.next_of_kin_phone} />
              <Field label="Address" value={client.next_of_kin_address} />
            </div>

            <SectionTitle>Products Interested In</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {client.interested_products.length > 0 ? (
                client.interested_products.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-[#D4AF37] px-3 py-1 text-[10px] font-medium text-[#051429]"
                  >
                    {PRODUCT_INTEREST_OPTIONS.find((o) => o.value === p)?.label ?? p}
                  </span>
                ))
              ) : (
                <p className="text-[11px] text-[#4B5563]">None recorded</p>
              )}
            </div>

            <SectionTitle>Account Summary</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Savings balance" value={formatGHS(savings?.balance ?? 0)} />
              <Field label="Susu balance (current cycle)" value={formatGHS(susu?.balance ?? 0)} />
              <Field label="Assigned agent" value={agent ? `${agent.full_name} (${agent.employee_code})` : null} />
            </div>

            <SectionTitle>Registration</SectionTitle>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field
                label="Client since"
                value={new Date(client.created_at).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
              />
            </div>

            {/* Signatures */}
            <div className="mt-16 grid grid-cols-2 gap-12">
              <div>
                <div className="h-px bg-[#051429]" />
                <p className="mt-1.5 text-[9px] text-[#4B5563]">Client signature / thumbprint</p>
              </div>
              <div>
                <div className="h-px bg-[#051429]" />
                <p className="mt-1.5 text-[9px] text-[#4B5563]">Staff signature</p>
              </div>
            </div>

            <p className="mt-10 text-center text-[8px] text-[#4B5563]">
              This document contains confidential client information and is intended for internal use only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
