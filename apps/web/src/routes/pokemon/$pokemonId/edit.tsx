import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameSelect } from "@/components/game-select";
import { BoxSelect } from "@/components/box-select";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { ArrowLeft, Mars, Minus, Save, Sparkles, Star, Venus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function EditPokemon() {
  const { pokemonId } = Route.useParams() as { pokemonId: string };
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ["pokemon", pokemonId],
    queryFn: () => api<any>(`/api/pokemon/${pokemonId}`),
  });

  // --- Species combobox ---
  const [speciesSearch, setSpeciesSearch] = useState("");
  const { data: speciesResults } = useSpeciesSearch(speciesSearch);
  const { data: defaultSpecies } = useQuery({
    queryKey: ["reference", "species", "default"],
    queryFn: () => api<{ data: { id: number; name: string; nationalDexNumber: number }[] }>("/api/reference/species?limit=200"),
    staleTime: 5 * 60_000,
  });
  const displaySpecies = speciesSearch.trim() ? (speciesResults?.data ?? []) : (defaultSpecies?.data ?? []);
  const speciesOptions = useMemo(
    () => displaySpecies.map((s: any) => ({ value: String(s.id), label: `#${s.nationalDexNumber} ${capitalize(s.name)}` })),
    [displaySpecies],
  );

  // --- Form state ---
  const [speciesId, setSpeciesId] = useState<string>("");
  const [formId, setFormId] = useState<string>("");
  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState("1");
  const [gender, setGender] = useState("genderless");
  const [isShiny, setIsShiny] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [location, setLocation] = useState("home");
  const [boxId, setBoxId] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!p) return;
    setSpeciesId(String(p.speciesId ?? ""));
    setFormId(p.formId ? String(p.formId) : "");
    setSpeciesSearch(capitalize(p.species?.name ?? ""));
    setNickname(p.nickname ?? capitalize(p.species?.name ?? ""));
    setLevel(String(p.level ?? 1));
    setGender(p.gender ?? "genderless");
    setIsShiny(p.isShiny ?? false);
    setIsFavorite(p.isFavorite ?? false);
    setLocation(p.location ?? "home");
    setBoxId(p.boxId ?? "");
    setSlot(p.slot ? String(p.slot) : "");
    setNotes(p.notes ?? "");
    setTags(p.tags ?? []);
  }, [p]);

  // --- Learnset → moves ---
  const { data: learnset } = useQuery({
    queryKey: ["reference", "learnset", Number(speciesId)],
    queryFn: () => api<{ moves: number[] }>(`/api/reference/species/${speciesId}/learnset`),
    enabled: !!speciesId,
    staleTime: 60_000,
  });
  const { data: allMoves } = useQuery({
    queryKey: ["reference", "moves", "all"],
    queryFn: () => api<any[]>("/api/reference/moves?limit=200"),
    staleTime: 5 * 60_000,
    enabled: !learnset?.moves?.length,
  });
  const { data: learnsetMoves } = useQuery({
    queryKey: ["reference", "moves", "byId", learnset?.moves?.join(",") ?? ""],
    queryFn: () => api<any[]>(`/api/reference/moves?ids=${learnset!.moves.join(",")}&limit=2000`),
    staleTime: 5 * 60_000,
    enabled: !!(learnset?.moves?.length),
  });

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
  const availableMoves = learnsetMoves ?? (allMoves ?? []);

  // --- Moves slots ---
  const currentMoves: any[] = p?.moves ?? [];
  const moveOptions = useMemo(
    () => availableMoves.map((m: any) => ({ value: String(m.id), label: capitalize(m.name) })),
    [availableMoves],
  );

  const setMove = async (s: number, moveId: number | null) => {
    const others = currentMoves.filter((m: any) => m.slot !== s);
    const updated = moveId
      ? [...others, { moveId, slot: s, ppUps: 0 }].sort((a: any, b: any) => a.slot - b.slot)
      : others.map((m: any, i: number) => ({ moveId: m.moveId, slot: i + 1, ppUps: m.ppUps }));
    await api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ moves: updated }) });
    qc.invalidateQueries({ queryKey: ["pokemon", pokemonId] });
  };

  const moveMap = new Map(currentMoves.map((m: any) => [m.slot, m]));

  // --- Save helpers ---
  const cycleGender = () => {
    const order: Array<typeof gender> = ["male", "female", "genderless"];
    const idx = order.indexOf(gender);
    const next = order[(idx + 1) % order.length]!;
    setGender(next);
    doSave({ gender: next });
  };
  const buildPatch = (overrides: Record<string, unknown> = {}) => {
    const body: Record<string, unknown> = {};
    if (speciesId) body.speciesId = Number(speciesId);
    body.formId = formId ? Number(formId) : null;
    body.nickname = nickname || null;
    body.level = Number(level);
    body.gender = gender;
    body.isShiny = isShiny;
    body.isFavorite = isFavorite;
    body.location = location;
    body.notes = notes || null;
    body.tags = tags;
    if (location === "home") { body.homePlan = "free"; body.boxId = boxId || null; body.slot = slot ? Number(slot) : null; }
    else { body.boxId = null; body.slot = null; }
    Object.assign(body, overrides);
    return body;
  };

  const doSave = async (overrides: Record<string, unknown> = {}) => {
    setError(""); setSaving(true);
    try {
      await api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(buildPatch(overrides)) });
      qc.invalidateQueries({ queryKey: ["pokemon"] });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { setError(err?.message ?? "Update failed"); }
    finally { setSaving(false); }
  };

  const removeTag = (t: string) => { const next = tags.filter(x => x !== t); setTags(next); doSave({ tags: next }); };
  const addTag = () => { const v = tagInput.trim(); if (!v || tags.includes(v)) return; const next = [...tags, v]; setTags(next); setTagInput(""); doSave({ tags: next }); };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!p) return <div className="py-12 text-center text-muted-foreground">Not found</div>;

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/pokemon/$pokemonId" params={{ pokemonId }}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
        <div className="flex items-center gap-2">{p.iconUrl && <SpriteImage src={p.iconUrl} alt="" className="h-8 w-8 object-contain" />}<h1 className="text-xl font-bold">{p.nickname ?? capitalize(p.species?.name ?? "")}</h1></div>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Identity</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={cycleGender} title={gender}>
              {gender === "female" ? <Venus className="h-5 w-5 text-pink-400" /> : gender === "male" ? <Mars className="h-5 w-5 text-blue-400" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setIsShiny(!isShiny); doSave({ isShiny: !isShiny }); }} title={isShiny ? "Not shiny" : "Shiny"}>
              <Sparkles className={`h-5 w-5 ${isShiny ? "text-purple-400" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setIsFavorite(!isFavorite); doSave({ isFavorite: !isFavorite }); }} title={isFavorite ? "Remove favorite" : "Add favorite"}>
              <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Species {p.speciesId !== Number(speciesId) && <span className="text-amber-400">(change = evolution!)</span>}</Label>
              <SearchableCombobox
                value={speciesId}
                onValueChange={(v) => { setSpeciesId(v); setFormId(""); }}
                options={speciesOptions}
                placeholder="Search by name or dex number..."
                emptyMessage="No species match"
              />
            </div>
            <div className="space-y-2"><Label>Nickname</Label><Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={capitalize(p.species?.name ?? "")} /></div>
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
          <div className="space-y-2"><Label>Level</Label><Input type="number" min={1} max={100} value={level} onChange={(e) => setLevel(e.target.value)} /></div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current Game</Label><GameSelect value={location} onValueChange={(v) => { setLocation(v); if (v !== "home") { setBoxId(""); setSlot(""); } }} /></div>
          {location === "home" && (<div className="grid grid-cols-2 gap-4 rounded-md border bg-secondary/30 p-3"><div className="space-y-2"><Label>Box</Label><BoxSelect value={boxId} onValueChange={setBoxId} /></div><div className="space-y-2"><Label>Slot (1-30)</Label><Input type="number" min={1} max={30} value={slot} onChange={(e) => setSlot(e.target.value)} /></div></div>)}
        </CardContent>
      </Card>

      {/* Moves */}
      <Card>
        <CardHeader><CardTitle>Moves</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[0, 1, 2, 3].map((idx) => {
            const slot = idx + 1;
            const move = moveMap.get(slot);
            return (
              <div key={slot} className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">Slot {slot}</span>
                <div className="flex-1">
                  <SearchableCombobox
                    value={move ? String(move.moveId) : ""}
                    onValueChange={(v) => setMove(slot, v ? Number(v) : null)}
                    options={moveOptions}
                    placeholder={move ? capitalize(move.move?.name ?? "") : "Search moves..."}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Tags & Notes */}
      <Card>
        <CardHeader><CardTitle>Tags & Notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">{tags.map((t) => (<Badge key={t} variant="secondary" className="gap-1 pr-1">{t}<button type="button" onClick={() => removeTag(t)} className="ml-1 rounded-full hover:bg-muted"><X className="h-3 w-3" /></button></Badge>))}</div>
          <div className="flex gap-2"><Input placeholder="New tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} /><Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>Add</Button></div>
          <div className="space-y-2"><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={() => doSave()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}</Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => { if (confirm("Delete this Pokémon?")) { api(`/api/pokemon/${pokemonId}`, { method: "DELETE" }).then(() => navigate({ to: "/pokemon" })); } }}>Delete</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/pokemon/$pokemonId/edit')({
  component: EditPokemon,
});
