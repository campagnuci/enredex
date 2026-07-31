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
import { useMemo, useState } from "react";

const SPECIAL_ENTRIES = [
  { code: "home", name: "Pokémon HOME" },
] as const;

interface GameSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeSpecial?: boolean;
}

export function GameSelect({
  value,
  onValueChange,
  placeholder = "Search games...",
  includeSpecial = true,
}: GameSelectProps) {
  const [search, setSearch] = useState("");

  const { data: bootstrap } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () =>
      api<{ games: { id: number; code: string; name: string }[] }>(
        "/api/reference/bootstrap",
      ),
    staleTime: 5 * 60_000,
  });

  const options = useMemo(() => {
    const entries: { code: string; name: string }[] = [];
    if (includeSpecial) entries.push(...SPECIAL_ENTRIES);
    if (bootstrap?.games) entries.push(...bootstrap.games.map((g) => ({ code: g.code, name: g.name })));

    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [bootstrap, search, includeSpecial]);

  const validCodes = useMemo(
    () => new Set(options.map((o) => o.code)),
    [options],
  );

  return (
    <Combobox
      value={value}
      onValueChange={(v) => {
        const code = v ?? "";
        if (code && !validCodes.has(code)) return; // ignore free-typed values
        onValueChange(code);
        const name = options.find((o) => o.code === code);
        setSearch(name?.name ?? "");
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
              onValueChange(first.code);
              setSearch(first.name);
            }
          }
        }}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {options.map((o) => (
            <ComboboxItem key={o.code} value={o.code}>
              {o.name}
            </ComboboxItem>
          ))}
          {options.length === 0 && <ComboboxEmpty>No games found</ComboboxEmpty>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
