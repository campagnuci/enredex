import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, Combobox } from "@/components/ui/combobox";
import { GameSelect } from "@/components/game-select";
import { BoxSelect } from "@/components/box-select";
import { capitalize } from "@/lib/strings";
import { useMemo, useState } from "react";

function useSpeciesSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["reference", "species", q],
    queryFn: () =>
      api<{ data: { id: number; name: string; nationalDexNumber: number }[] }>(
        `/api/reference/species?search=${encodeURIComponent(q)}&limit=100`,
      ),
    staleTime: 60_000,
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
  });
}

function NewPokemon() {
  const navigate = useNavigate();
  const [speciesId, setSpeciesId] = useState("");
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [level, setLevel] = useState("1");
  const [location, setLocation] = useState("home");
  const [boxId, setBoxId] = useState("");
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initial load (no search) + search results
  const { data: species } = useSpeciesSearch(speciesSearch);

  // Load a default set for the initial empty state
  const { data: defaultSpecies } = useQuery({
    queryKey: ["reference", "species", "default"],
    queryFn: () =>
      api<{ data: { id: number; name: string; nationalDexNumber: number }[] }>(
        "/api/reference/species?limit=100",
      ),
    staleTime: 5 * 60_000,
  });

  const displaySpecies = speciesSearch.trim()
    ? (species?.data ?? [])
    : (defaultSpecies?.data ?? []);

  const validSpeciesIds = useMemo(
    () => new Set(displaySpecies.map((s) => String(s.id))),
    [displaySpecies],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = { speciesId: Number(speciesId), level: Number(level), location };
      if (location === "home") Object.assign(body, { homePlan: "free", boxId, slot: Number(slot) });
      await api("/api/pokemon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      navigate({ to: "/pokemon" });
    } catch (err: any) {
      setError(err?.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Add Pokémon</h1>
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Species</Label>
              <Combobox
                value={speciesId}
                onValueChange={(val) => {
                  const id = val ?? "";
                  if (id && !validSpeciesIds.has(id)) return;
                  setSpeciesId(id);
                  const name = displaySpecies.find((s) => String(s.id) === id);
                  setSpeciesSearch(name ? capitalize(name.name) : "");
                }}
              >
                <ComboboxInput
                  placeholder="Search by name or dex number..."
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const first = displaySpecies[0];
                      if (first) {
                        const id = String(first.id);
                        setSpeciesId(id);
                        setSpeciesSearch(capitalize(first.name));
                      }
                    }
                  }}
                  showClear
                />
                <ComboboxContent className="w-full">
                  <ComboboxList>
                    {displaySpecies.map((s) => (
                      <ComboboxItem key={s.id} value={String(s.id)}>
                        #{s.nationalDexNumber} {capitalize(s.name)}
                      </ComboboxItem>
                    ))}
                    {displaySpecies.length === 0 && (
                      <ComboboxEmpty>
                        {speciesSearch.trim() ? "No species match" : "Type to search species"}
                      </ComboboxEmpty>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Input type="number" min={1} max={100} value={level} onChange={(e) => setLevel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <GameSelect value={location} onValueChange={setLocation} />
              </div>
            </div>
            {location === "home" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Box</Label>
                  <BoxSelect value={boxId} onValueChange={setBoxId} />
                </div>
                <div className="space-y-2">
                  <Label>Slot (1-30)</Label>
                  <Input type="number" min={1} max={30} value={slot} onChange={(e) => setSlot(e.target.value)} />
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !speciesId}>{loading ? "Creating..." : "Create Pokémon"}</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/pokemon/new')({
  component: NewPokemon,
});
