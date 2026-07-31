import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { useState } from "react";

interface BoxSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

function useBoxesSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["boxes", "search", q],
    queryFn: () =>
      api<{ id: string; name: string; pokemonCount: number }[]>(
        `/api/boxes?search=${encodeURIComponent(q)}`,
      ),
    staleTime: 30_000,
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
  });
}

export function BoxSelect({
  value,
  onValueChange,
  placeholder = "Search boxes...",
}: BoxSelectProps) {
  const [search, setSearch] = useState("");

  const { data: searchResults } = useBoxesSearch(search);
  const { data: defaultBoxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<{ id: string; name: string; pokemonCount: number }[]>("/api/boxes"),
  });

  const options = search.trim() ? (searchResults ?? []) : (defaultBoxes ?? []);

  return (
    <Combobox
      value={value}
      onValueChange={(v) => {
        const id = v ?? "";
        if (id && !options.some((o) => o.id === id)) return;
        onValueChange(id);
        const box = options.find((o) => o.id === id);
        setSearch(box?.name ?? "");
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const first = options[0];
            if (first) {
              onValueChange(first.id);
              setSearch(first.name);
            }
          }
        }}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {options.map((b) => (
            <ComboboxItem key={b.id} value={b.id}>
              {b.name} ({b.pokemonCount}/30)
            </ComboboxItem>
          ))}
          {options.length === 0 && (
            <ComboboxEmpty>
              {search.trim() ? "No boxes match" : "No boxes yet"}
            </ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
