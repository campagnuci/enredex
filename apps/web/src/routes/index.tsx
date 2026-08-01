import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { Swords, Package, Star, Sparkles, Hash, Plus, ArrowRight } from "lucide-react";
import { useMemo } from "react";

interface PokemonItem {
  id: string;
  nickname: string | null;
  species: { id: number; name: string; nationalDexNumber: number };
  level: number;
  isShiny: boolean;
  isFavorite: boolean;
  location: string;
  iconUrl: string | null;
  tags: string[];
}

function Dashboard() {
  const { data: pokemon, isLoading } = useQuery({
    queryKey: ["pokemon", "dashboard"],
    queryFn: () => api<{ data: PokemonItem[]; total: number }>("/api/pokemon?limit=200&sort=updatedAt"),
  });
  const { data: boxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<{ id: string; name: string; pokemonCount: number }[]>("/api/boxes"),
  });

  const stats = useMemo(() => {
    if (!pokemon?.data) return { uniqueSpecies: 0, shinies: 0, favorites: 0 };
    const speciesSet = new Set<number>();
    let shinies = 0, favorites = 0;
    for (const p of pokemon.data) {
      speciesSet.add(p.species.id);
      if (p.isShiny) shinies++;
      if (p.isFavorite) favorites++;
    }
    return { uniqueSpecies: speciesSet.size, shinies, favorites };
  }, [pokemon]);

  const recent = pokemon?.data.slice(0, 6) ?? [];
  const byLocation = useMemo(() => {
    const map = new Map<string, number>();
    if (!pokemon?.data) return [];
    for (const p of pokemon.data) map.set(p.location, (map.get(p.location) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [pokemon]);

  const statCards = [
    { label: "Pokémon", value: pokemon?.total ?? "-", icon: Swords, color: "text-blue-400", to: "/pokemon" },
    { label: "Unique species", value: stats.uniqueSpecies, icon: Hash, color: "text-purple-400" },
    { label: "Shinies", value: stats.shinies, icon: Sparkles, color: "text-amber-400" },
    { label: "Favorites", value: stats.favorites, icon: Star, color: "text-red-400" },
  ];

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/pokemon/new">
          <Button size="sm"><Plus className="h-4 w-4" />Add Pokémon</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const content = (
            <Card className={s.to ? "cursor-pointer transition-colors hover:bg-accent" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{isLoading ? <Skeleton className="h-9 w-16" /> : s.value}</p>
              </CardContent>
            </Card>
          );
          return s.to ? (
            <Link key={s.label} to={s.to}>{content}</Link>
          ) : (
            <div key={s.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link to="/pokemon/new">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" />Catch a Pokémon</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/boxes">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2"><Package className="h-4 w-4" />Browse boxes</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            {boxes?.map((box) => (
              <Link key={box.id} to="/boxes/$boxId" params={{ boxId: box.id }}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2"><Package className="h-4 w-4" />{box.name}</span>
                  <span className="text-sm text-muted-foreground">{box.pokemonCount}/30</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Location breakdown */}
        <Card>
          <CardHeader><CardTitle>Where are they?</CardTitle></CardHeader>
          <CardContent>
            {byLocation.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Pokémon yet</p>
            ) : (
              <div className="space-y-2">
                {byLocation.map(([loc, count]) => (
                  <div key={loc} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm capitalize">{loc.replace(/-/g, " ")}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently added */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent additions</CardTitle>
          <Link to="/pokemon"><Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3 w-3" /></Button></Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-2 sm:grid-cols-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No Pokémon in your collection yet.{" "}
              <Link to="/pokemon/new" className="font-medium text-primary underline">Add your first one.</Link>
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => (
                <Link key={p.id} to="/pokemon/$pokemonId" params={{ pokemonId: p.id }}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                      {p.iconUrl ? (
                        <SpriteImage src={p.iconUrl!} alt="" className="h-8 w-8 object-contain" loading="lazy" />
                      ) : (
                        <Swords className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{p.nickname ?? capitalize(p.species.name)}</p>
                        {p.isFavorite && <Star className="h-3 w-3 shrink-0 text-amber-400" fill="currentColor" />}
                        {p.isShiny && <Sparkles className="h-3 w-3 shrink-0 text-purple-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        #{p.species.nationalDexNumber} · Lv.{p.level} · {p.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: Dashboard,
});
