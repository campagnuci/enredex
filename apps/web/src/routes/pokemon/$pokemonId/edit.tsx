import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

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

  const [speciesSearch, setSpeciesSearch] = useState("");
  const { data: speciesResults } = useSpeciesSearch(speciesSearch);
  const { data: defaultSpecies } = useQuery({
    queryKey: ["reference", "species", "default"],
    queryFn: () => api<{ data: { id: number; name: string; nationalDexNumber: number }[] }>("/api/reference/species?limit=100"),
    staleTime: 5 * 60_000,
  });
  const displaySpecies = speciesSearch.trim() ? (speciesResults?.data ?? []) : (defaultSpecies?.data ?? []);

  const { data: movesList } = useQuery({
    queryKey: ["reference", "moves", "all"],
    queryFn: () => api<any[]>("/api/reference/moves?search=&limit=500"),
    staleTime: 5 * 60_000,
  });
  const { data: userBoxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<any[]>("/api/boxes"),
  });

  const [speciesId, setSpeciesId] = useState<string>("");
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
  const [newMoveId, setNewMoveId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!p) return;
    setSpeciesId(String(p.speciesId ?? ""));
    setNickname(p.nickname ?? "");
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

  const currentMoves = p?.moves ?? [];

  const buildPatch = (overrides: Record<string, unknown> = {}) => {
    const body: Record<string, unknown> = { ...overrides };
    if (speciesId) body.speciesId = Number(speciesId);
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

  const addMove = async () => {
    if (!newMoveId || currentMoves.length >= 4) return;
    const moves = [...currentMoves.map((m: any) => ({ moveId: m.moveId, slot: m.slot, ppUps: m.ppUps })), { moveId: Number(newMoveId), slot: currentMoves.length + 1, ppUps: 0 }];
    await api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ moves }) });
    qc.invalidateQueries({ queryKey: ["pokemon", pokemonId] }); setNewMoveId("");
  };
  const removeMove = async (s: number) => {
    const moves = currentMoves.filter((m: any) => m.slot !== s).map((m: any, i: number) => ({ moveId: m.moveId, slot: i + 1, ppUps: m.ppUps }));
    await api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ moves }) });
    qc.invalidateQueries({ queryKey: ["pokemon", pokemonId] });
  };
  const removeTag = (t: string) => { const next = tags.filter(x => x !== t); setTags(next); doSave({ tags: next }); };
  const addTag = () => { const v = tagInput.trim(); if (!v || tags.includes(v)) return; const next = [...tags, v]; setTags(next); setTagInput(""); doSave({ tags: next }); };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!p) return <div className="py-12 text-center text-muted-foreground">Not found</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/pokemon/$pokemonId" params={{ pokemonId }}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
        <div className="flex items-center gap-2">{p.iconUrl && <SpriteImage src={p.iconUrl} alt="" className="h-8 w-8 object-contain" />}<h1 className="text-xl font-bold">{p.nickname ?? capitalize(p.species?.name ?? "")}</h1></div>
      </div>
      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Species {p.speciesId !== Number(speciesId) && <span className="text-amber-400">(change = evolution!)</span>}</Label>
              <Combobox value={speciesId} onValueChange={(val) => setSpeciesId(val ?? "")}>
                <ComboboxInput placeholder="Search by name or dex number..." value={speciesSearch} onChange={(e) => setSpeciesSearch(e.target.value)} showClear />
                <ComboboxContent><ComboboxList>
                  {displaySpecies.map((s: any) => (<ComboboxItem key={s.id} value={String(s.id)}>#{s.nationalDexNumber} {capitalize(s.name)}</ComboboxItem>))}
                  {displaySpecies.length === 0 && <ComboboxEmpty>{speciesSearch.trim() ? "No species match" : "Type to search"}</ComboboxEmpty>}
                </ComboboxList></ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-2"><Label>Nickname</Label><Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={capitalize(p.species?.name ?? "")} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Level</Label><Input type="number" min={1} max={100} value={level} onChange={(e) => setLevel(e.target.value)} /></div>
            <div className="space-y-2"><Label>Gender</Label><Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="genderless">Genderless</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Shiny</Label><Select value={isShiny ? "true" : "false"} onValueChange={(v) => setIsShiny(v === "true")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Current Game</Label><Select value={location} onValueChange={(v) => { setLocation(v); if (v !== "home") { setBoxId(""); setSlot(""); } }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home">Pokémon HOME</SelectItem><SelectItem value="scarlet">Scarlet</SelectItem><SelectItem value="violet">Violet</SelectItem><SelectItem value="sword">Sword</SelectItem><SelectItem value="shield">Shield</SelectItem><SelectItem value="legends-arceus">Legends: Arceus</SelectItem><SelectItem value="brilliant-diamond">Brilliant Diamond</SelectItem><SelectItem value="shining-pearl">Shining Pearl</SelectItem><SelectItem value="pokemon-go">Pokémon GO</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Favorite</Label><Select value={isFavorite ? "true" : "false"} onValueChange={(v) => setIsFavorite(v === "true")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">★ Favorite</SelectItem></SelectContent></Select></div>
          </div>
          {location === "home" && (<div className="grid grid-cols-2 gap-4 rounded-md border bg-secondary/30 p-3"><div className="space-y-2"><Label>Box</Label><Select value={boxId} onValueChange={setBoxId}><SelectTrigger><SelectValue placeholder="Select box" /></SelectTrigger><SelectContent>{userBoxes?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.pokemonCount}/30)</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Slot (1-30)</Label><Input type="number" min={1} max={30} value={slot} onChange={(e) => setSlot(e.target.value)} /></div></div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Moves</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">{currentMoves.map((m: any) => (<Badge key={m.slot} variant="outline" className="gap-1 pr-1">{m.move?.name ?? `Slot ${m.slot}`}<button type="button" onClick={() => removeMove(m.slot)} className="ml-1 rounded-full hover:bg-muted"><X className="h-3 w-3" /></button></Badge>))}{currentMoves.length === 0 && <p className="text-sm text-muted-foreground">No moves</p>}</div>
          {currentMoves.length < 4 && (<div className="flex gap-2"><Select value={newMoveId} onValueChange={setNewMoveId}><SelectTrigger className="flex-1"><SelectValue placeholder="Add a move..." /></SelectTrigger><SelectContent className="max-h-48">{movesList?.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="icon" onClick={addMove} disabled={!newMoveId}><Plus className="h-4 w-4" /></Button></div>)}
        </CardContent>
      </Card>
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
