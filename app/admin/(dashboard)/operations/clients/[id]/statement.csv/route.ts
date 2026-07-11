import { NextResponse } from "next/server";

import { getClientActivity, getClientById } from "@/lib/data/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, activity] = await Promise.all([getClientById(id), getClientActivity(id)]);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const header = "Date,Type,Description,Amount (GHS)";
  const rows = activity.map((a) => `${new Date(a.date).toISOString()},${a.type},"${a.description}",${a.amount}`);
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${client.client_code}-statement.csv"`,
    },
  });
}
