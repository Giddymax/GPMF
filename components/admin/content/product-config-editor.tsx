"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ProductConfig } from "@/lib/supabase/types";
import { updateProductConfig } from "@/app/admin/(dashboard)/content/actions";

export function ProductConfigEditor({ configs }: { configs: ProductConfig[] }) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(configs.map((c) => [c.id, JSON.stringify(c.value, null, 2)]))
  );
  const [pending, setPending] = React.useState<string | null>(null);

  async function save(id: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(values[id]);
    } catch {
      toast.error("Invalid JSON.");
      return;
    }
    setPending(id);
    const result = await updateProductConfig(id, parsed);
    setPending(null);
    if (result.ok) {
      toast.success("Configuration updated.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not save.");
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {configs.map((config) => (
        <Card key={config.id} className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-sm text-white">{config.key}</CardTitle>
            {config.description ? <p className="text-xs text-white/50">{config.description}</p> : null}
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              className="font-mono text-xs"
              value={values[config.id]}
              onChange={(e) => setValues((v) => ({ ...v, [config.id]: e.target.value }))}
            />
            <Button size="sm" className="mt-3" disabled={pending === config.id} onClick={() => save(config.id)}>
              {pending === config.id ? "Saving…" : "Save"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
