import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface SearchableComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  /** All options when filtering client-side. Omit if using fetchOptions. */
  options?: ComboboxOption[];
  placeholder?: string;
  /** Called with the search string, must return options. Used for server-side filtering. */
  fetchOptions?: (search: string) => ComboboxOption[];
  /** Display text when no results. */
  emptyMessage?: string;
}

export function SearchableCombobox({
  value,
  onValueChange,
  options: propOptions,
  placeholder = "Search...",
  fetchOptions,
  emptyMessage = "No results found",
}: SearchableComboboxProps) {
  const [search, setSearch] = useState("");

  const displayOptions = useMemo(() => {
    if (fetchOptions) return fetchOptions(search);
    if (!propOptions) return [];
    const q = search.toLowerCase().trim();
    if (!q) return propOptions;
    return propOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [propOptions, search, fetchOptions]);

  const handleSelect = (val: string) => {
    if (val && !displayOptions.some((o) => o.value === val)) return;
    onValueChange(val);
    const match = displayOptions.find((o) => o.value === val);
    setSearch(match?.label ?? "");
  };

  // Pre-fill the search text when the value is known but search is empty
  useEffect(() => {
    if (!value || search) return;
    const match = displayOptions.find((o) => o.value === value);
    if (match) setSearch(match.label);
  }, [value, displayOptions, search]);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayOptions.length > 0) {
      e.preventDefault();
      const first = displayOptions[0]!;
      handleSelect(first.value);
    }
  };

  return (
    <Combobox value={value} onValueChange={(v) => handleSelect(v ?? "")}>
      <ComboboxInput
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleEnter}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {displayOptions.map((o) => (
            <ComboboxItem key={o.value} value={o.value}>
              {o.label}
            </ComboboxItem>
          ))}
          {displayOptions.length === 0 && (
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
