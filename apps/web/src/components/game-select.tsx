import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SearchableCombobox } from "@/components/searchable-combobox";

const SPECIAL_ENTRIES = [
  { value: "home", label: "Pokémon HOME" },
  { value: "pokemon-bank", label: "Pokémon Bank" },
  { value: "other", label: "Other" },
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
  const { data: bootstrap } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () =>
      api<{ games: { id: number; code: string; name: string }[] }>(
        "/api/reference/bootstrap",
      ),
    staleTime: 5 * 60_000,
  });

  const options = useMemo(() => {
    const entries: { value: string; label: string }[] = [];
    if (includeSpecial) entries.push(...SPECIAL_ENTRIES);
    if (bootstrap?.games)
      entries.push(...bootstrap.games.map((g) => ({ value: g.code, label: g.name })));
    return entries;
  }, [bootstrap, includeSpecial]);

  return (
    <SearchableCombobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
    />
  );
}
