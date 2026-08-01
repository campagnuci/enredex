import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameSelect } from "@/components/game-select";
import { BoxSelect } from "@/components/box-select";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { capitalize } from "@/lib/strings";
import { useMemo, useState } from "react";

function NewPokemon() {
  const navigate = useNavigate();
  const [speciesId, setSpeciesId] = useState("");
  const [formId, setFormId] = useState("");
  const [level, setLevel] = useState("1");
  const [location, setLocation] = useState("home");
  const [boxId, setBoxId] = useState("");
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: defaultSpecies } = useQuery({
    queryKey: ["reference", "species", "default"],
    queryFn: () => api<{ data: { id: number; name: string; nationalDexNumber: number }[] }>("/api/reference/species?limit=200"),
    staleTime: 5 * 60_000,
  });

  const speciesOptions = useMemo(
    () =>
      (defaultSpecies?.data ?? []).map((s) => ({
        value: String(s.id),
        label: `#${s.nationalDexNumber} ${capitalize(s.name)}`,
      })),
    [defaultSpecies],
  );

  // Fetch forms when a species is selected
  const { data: speciesForms } = useQuery({
    queryKey: ["reference", "forms", speciesId],
    queryFn: () => api<{ forms: { id: number; name: string; formType: string; isDefault: boolean }[] }>(`/api/reference/species/${speciesId}`),
    enabled: !!speciesId,
    staleTime: 5 * 60_000,
  });

  const formOptions = useMemo(() => {
    if (!speciesForms?.forms?.length) return [];
    return speciesForms.forms
      .filter((f) => !f.isDefault)
      .map((f) => ({ value: String(f.id), label: capitalize(f.name) }));
  }, [speciesForms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = { speciesId: Number(speciesId), level: Number(level), location };
      if (formId) body.formId = Number(formId);
      if (location === "home") Object.assign(body, { homePlan: "free", boxId, slot: Number(slot) });
      const created: { id: string } = await api("/api/pokemon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      navigate({ to: "/pokemon/$pokemonId/edit", params: { pokemonId: created.id } });
    } catch (err: any) {
      setError(err?.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Add Pokémon</h1>
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Species</Label>
              <SearchableCombobox
                value={speciesId}
                onValueChange={(v) => { setSpeciesId(v); setFormId(""); }}
                options={speciesOptions}
                placeholder="Search by name or dex number..."
                emptyMessage="No species match"
              />
            </div>
            {formOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Form</Label>
                <SearchableCombobox
                  value={formId}
                  onValueChange={setFormId}
                  options={formOptions}
                  placeholder="Select form..."
                  emptyMessage="No forms"
                />
              </div>
            )}
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
