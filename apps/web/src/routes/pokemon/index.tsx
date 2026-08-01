import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PokemonItem {
  id: string;
  nickname: string | null;
  species: { id: number; name: string; nationalDexNumber: number };
  form: { id: number; name: string } | null;
  level: number;
  gender: string;
  isShiny: boolean;
  location: string;
  iconUrl: string | null;
  tags: string[];
  isFavorite: boolean;
}

function PokemonList() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 30;

  const { data, isLoading } = useQuery({
    queryKey: ["pokemon", { q, offset: page * limit, limit }],
    queryFn: () => api<{ data: PokemonItem[]; total: number }>(`/api/pokemon?limit=${limit}&offset=${page * limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pokémon</h1>
        <Link to="/pokemon/new">
          <Button size="sm"><Plus className="h-4 w-4" />Add Pokémon</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, nickname, species..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((p) => (
              <Link key={p.id} to="/pokemon/$pokemonId" params={{ pokemonId: p.id }}>
                <Card className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    {p.iconUrl ? (
                      <SpriteImage src={p.iconUrl!} alt="" className="h-12 w-12 object-contain" loading="lazy" />
                    ) : (
                      <span className="text-xs text-muted-foreground">?</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{p.nickname ?? capitalize(p.species.name)}</p>
                      {p.isFavorite && <span className="text-amber-400">★</span>}
                      {p.isShiny && <span className="text-purple-400">✦</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      #{p.species.nationalDexNumber} · Lv.{p.level} · {p.location}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.tags?.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {data && data.total > limit && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}
              </span>
              <Button variant="outline" size="sm" disabled={(page + 1) * limit >= data.total} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute('/pokemon/')({
  component: PokemonList,
});
