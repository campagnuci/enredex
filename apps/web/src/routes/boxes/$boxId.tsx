import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { ArrowLeft } from "lucide-react";

interface Occupant {
  id: string;
  slot: number;
  speciesName: string;
  nickname: string | null;
  level: number;
  isShiny: boolean;
  isFavorite: boolean;
  iconUrl: string | null;
}

function BoxGrid() {
  const { boxId } = Route.useParams() as { boxId: string };
  const { data, isLoading } = useQuery({
    queryKey: ["box", boxId],
    queryFn: () => api<{ name: string; occupants: Occupant[] }>(`/api/boxes/${boxId}`),
  });

  if (isLoading) return <Skeleton className="h-[32rem] rounded-xl" />;

  // Build a 6×5 grid (30 slots)
  const slots = Array.from({ length: 30 }, (_, i) => i + 1);
  const occupantMap = new Map(data?.occupants.map((o) => [o.slot, o]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/boxes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">{data?.name ?? "Box"}</h1>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {slots.map((slot) => {
          const p = occupantMap.get(slot);
          const card = (
            <Card className={`flex aspect-square flex-col items-center justify-center gap-1 p-1 transition-colors ${p ? "hover:bg-accent" : "bg-secondary/30"}`}>
              {p ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center">
                    {p.iconUrl ? (
                      <SpriteImage src={p.iconUrl!} alt="" className="h-9 w-9 object-contain" loading="lazy" />
                    ) : (
                      <span className="text-xs text-muted-foreground">?</span>
                    )}
                  </div>
                  <div className="w-full truncate text-center text-[10px]">
                    <span className={p.isShiny ? "text-purple-400" : ""}>{p.nickname ?? capitalize(p.speciesName)}</span>
                    {p.isFavorite && <span className="text-amber-400">★</span>}
                  </div>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{slot}</span>
              )}
            </Card>
          );
          return p ? (
            <Link key={p.id} to="/pokemon/$pokemonId" params={{ pokemonId: p.id }}>
              {card}
            </Link>
          ) : (
            <div key={slot}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/boxes/$boxId')({
  component: BoxGrid,
});
