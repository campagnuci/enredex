import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { capitalize } from "@/lib/strings";
import { useState } from "react";

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

  const { data: boxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<any[]>("/api/boxes"),
  });

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
              <Combobox value={speciesId} onValueChange={(val) => setSpeciesId(val ?? "")}>
                <ComboboxInput
                  placeholder="Search by name or dex number..."
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
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
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">HOME</SelectItem>
                    <SelectItem value="scarlet">Scarlet</SelectItem>
                    <SelectItem value="violet">Violet</SelectItem>
                    <SelectItem value="sword">Sword</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="pokemon-go">Pokémon GO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {location === "home" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Box</Label>
                  <Select value={boxId} onValueChange={setBoxId}>
                    <SelectTrigger><SelectValue placeholder="Select box" /></SelectTrigger>
                    <SelectContent>
                      {boxes?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
