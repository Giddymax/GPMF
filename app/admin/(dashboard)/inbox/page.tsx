import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { ApplicationsTable } from "@/components/admin/inbox/applications-table";
import { InquiriesTable } from "@/components/admin/inbox/inquiries-table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApplications, getInquiries } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Website Inbox" };

export default async function InboxPage() {
  const [applications, inquiries] = await Promise.all([getApplications(), getInquiries()]);
  const newCount = applications.filter((a) => a.status === "new").length + inquiries.filter((i) => i.status === "new").length;

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Website Inbox</h1>
        <p className="mt-1 text-sm text-white/50">{newCount} new item{newCount === 1 ? "" : "s"} awaiting a first touch.</p>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <ApplicationsTable applications={applications} />
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <InquiriesTable inquiries={inquiries} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
