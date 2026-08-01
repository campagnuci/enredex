import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { SearchableCombobox } from "@/components/searchable-combobox";

interface BoxSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BoxSelect({
  value,
  onValueChange,
  placeholder = "Search boxes...",
}: BoxSelectProps) {
  const { data: boxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<{ id: string; name: string; pokemonCount: number }[]>("/api/boxes"),
  });

  const options = (boxes ?? []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.pokemonCount}/30)`,
  }));

  return (
    <SearchableCombobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
    />
  );
}
