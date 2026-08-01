import { createFileRoute, Link, Outlet, useMatches, useRouter } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { ArrowLeft, Mars, Minus, Pencil, Sparkles, Star, Trash2, Venus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

function PokemonDetail() {
  const { pokemonId } = Route.useParams() as { pokemonId: string };
  const navigate = useNavigate();
  const router = useRouter();
  const matches = useMatches();

  const goBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/pokemon" });
    }
  };
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ["pokemon", pokemonId],
    queryFn: () => api<any>(`/api/pokemon/${pokemonId}`),
  });

  const toggleFavorite = useMutation({
    mutationFn: (val: boolean) =>
      api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isFavorite: val }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pokemon"] }),
  });
  const toggleShiny = useMutation({
    mutationFn: (val: boolean) =>
      api(`/api/pokemon/${pokemonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isShiny: val }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pokemon"] }),
  });

  // If a child route (edit) is active, yield to it
  if (matches.length > 2) return <Outlet />;

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!p) return <p className="text-muted-foreground">Not found</p>;

  const handleDelete = async () => {
    if (!confirm("Delete this Pokémon?")) return;
    await api(`/api/pokemon/${pokemonId}`, { method: "DELETE" });
    goBack();
  };

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="h-4 w-4" />Back</Button>
        <div className="flex items-center gap-2">
          <Button
            variant={p.isShiny ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleShiny.mutate(!p.isShiny)}
            title={p.isShiny ? "Not shiny" : "Shiny"}
          >
            <Sparkles className={`h-4 w-4 ${p.isShiny ? "text-purple-400" : ""}`} />
          </Button>
          <Button
            variant={p.isFavorite ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleFavorite.mutate(!p.isFavorite)}
            title={p.isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <Star className={`h-4 w-4 ${p.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
          </Button>
          <Link to="/pokemon/$pokemonId/edit" params={{ pokemonId }}>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4" />Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Artwork */}
        <div className="flex flex-col items-center gap-3">
          {p.artworkUrl ? (
            <SpriteImage src={p.artworkUrl} alt="" className="h-48 w-48 rounded-xl border bg-secondary object-contain" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border bg-secondary text-muted-foreground">?</div>
          )}
          {p.iconUrl && <SpriteImage src={p.iconUrl} alt="" className="h-16 w-16 object-contain" />}
        </div>

        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{p.nickname ?? capitalize(p.species?.name ?? "Unknown")}</h1>
              {p.isShiny && <Badge variant="secondary">Shiny</Badge>}
              {p.isFavorite && <span className="text-amber-400">★</span>}
            </div>
            <p className="text-muted-foreground">
              {p.species?.name && (
                <span>#{p.species.nationalDexNumber} {capitalize(p.species.name)}</span>
              )}
              {p.form && <span> · {p.form.name}</span>}
              {" · "}Lv.{p.level}
              {" · "}{p.gender === "female" ? <Venus className="inline h-4 w-4 text-pink-400" /> : p.gender === "male" ? <Mars className="inline h-4 w-4 text-blue-400" /> : <Minus className="inline h-4 w-4 text-muted-foreground" />}
            </p>
          </div>

          <Separator />

          {/* Properties grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Location" value={p.location} />
            <Field label="Language" value={p.language ?? "-"} />
            <Field label="Ball" value={p.ball?.name ?? "-"} />
            <Field label="Nature" value={p.nature?.name ?? "-"} />
            <Field label="Ability" value={`${p.ability?.name ?? "-"}${p.isHiddenAbility ? " (HA)" : ""}`} />
            <Field label="Held Item" value={p.heldItem?.name ?? "-"} />
            <Field label="OT" value={p.otName ?? "-"} />
            <Field label="TID" value={String(p.trainerId ?? "-")} />
            <Field label="Origin Game" value={p.originGame?.name ?? "-"} />
            <Field label="Met Location" value={p.metLocation ?? "-"} />
            <Field label="Met Level" value={String(p.metLevel ?? "-")} />
          </div>

          {/* Moves */}
          {p.moves?.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-medium">Moves</h3>
                <div className="flex flex-wrap gap-2">
                  {p.moves.map((m: any) => (
                    <Badge key={m.slot} variant="outline">{capitalize(m.move?.name ?? `Slot ${m.slot}`)}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {p.tags?.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {p.notes && (
            <>
              <Separator />
              <div>
                <h3 className="mb-1 font-medium">Notes</h3>
                <p className="text-sm text-muted-foreground">{p.notes}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

export const Route = createFileRoute('/pokemon/$pokemonId')({
  component: PokemonDetail,
});
