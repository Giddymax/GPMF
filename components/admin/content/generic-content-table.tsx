"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ContentField, ContentTable } from "@/lib/admin-content-config";
import { uploadHeroSlideImage } from "@/lib/storage/upload-hero-slide-image";
import { deleteContentRow, upsertContentRow } from "@/app/admin/(dashboard)/content/actions";

interface Row {
  id: string;
  [key: string]: unknown;
}

export function GenericContentTable({
  table,
  title,
  fields,
  primaryField,
  rows,
}: {
  table: ContentTable;
  title: string;
  fields: ContentField[];
  primaryField: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadingField, setUploadingField] = React.useState<string | null>(null);

  async function handleImageChange(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    const result = await uploadHeroSlideImage(file);
    setUploadingField(null);
    if (result.ok && result.url) {
      setValues((val) => ({ ...val, [field]: result.url }));
    } else {
      toast.error(result.error || "Could not upload the image.");
    }
  }

  function openNew() {
    setEditing(null);
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.type === "boolean" ? true : ""])));
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setValues(row);
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    const result = await upsertContentRow(table, editing?.id ?? null, values);
    setSubmitting(false);
    if (result.ok) {
      toast.success("Saved.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Could not save.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    const result = await deleteContentRow(table, id);
    if (result.ok) {
      toast.success("Deleted.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not delete.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/50">{fields.find((f) => f.key === primaryField)?.label ?? "Name"}</TableHead>
            {fields.some((f) => f.type === "boolean") ? <TableHead className="text-white/50">Status</TableHead> : null}
            <TableHead className="text-white/50" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const boolField = fields.find((f) => f.type === "boolean");
            return (
              <TableRow key={row.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="max-w-md truncate text-white">{String(row[primaryField] ?? "—")}</TableCell>
                {boolField ? (
                  <TableCell>
                    <Badge variant={row[boolField.key] ? "emerald" : "muted"}>
                      {row[boolField.key] ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                ) : null}
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(row.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length === 0 ? <p className="p-6 text-center text-sm text-white/40">No items yet.</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                {field.type === "image" ? (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      {values[field.key] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={String(values[field.key])}
                          alt=""
                          className="h-14 w-24 rounded-md border border-border object-cover"
                        />
                      ) : null}
                      <div>
                        <Input
                          id={field.key}
                          type="file"
                          accept="image/*"
                          className="max-w-xs"
                          onChange={(e) => handleImageChange(field.key, e)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {uploadingField === field.key ? "Uploading…" : values[field.key] ? "Uploaded." : "No image yet."}
                        </p>
                      </div>
                    </div>
                  </>
                ) : field.type === "boolean" ? (
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Switch
                      id={field.key}
                      checked={Boolean(values[field.key])}
                      onCheckedChange={(v) => setValues((val) => ({ ...val, [field.key]: v }))}
                    />
                  </div>
                ) : field.type === "textarea" ? (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Textarea
                      id={field.key}
                      className="mt-1.5"
                      rows={4}
                      value={String(values[field.key] ?? "")}
                      onChange={(e) => setValues((val) => ({ ...val, [field.key]: e.target.value }))}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type === "number" ? "number" : "text"}
                      className="mt-1.5"
                      value={String(values[field.key] ?? "")}
                      onChange={(e) =>
                        setValues((val) => ({
                          ...val,
                          [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
