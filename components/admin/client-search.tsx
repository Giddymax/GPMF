"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchClients } from "@/app/admin/(dashboard)/operations/deposits/actions";

export function ClientSearch({
  onSelect,
  placeholder = "Search client by name or code…",
}: {
  onSelect: (client: { id: string; label: string }) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{ id: string; label: string }[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selected || query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const matches = await searchClients(query);
      setResults(matches);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, selected]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {results.length > 0 ? (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-white/10 bg-navy-800 shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                onClick={() => {
                  setQuery(r.label);
                  setSelected(r.id);
                  setResults([]);
                  onSelect(r);
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
