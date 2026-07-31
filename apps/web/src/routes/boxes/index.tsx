import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

interface BoxItem {
  id: string;
  name: string;
  position: number;
  pokemonCount: number;
}

function BoxesIndex() {
  const { data: boxes } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api<BoxItem[]>("/api/boxes"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Boxes</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boxes?.map((box) => (
          <Link key={box.id} to="/boxes/$boxId" params={{ boxId: box.id }}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-accent">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{box.name}</p>
                <p className="text-sm text-muted-foreground">{box.pokemonCount} / 30 Pokémon</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/boxes/')({
  component: BoxesIndex,
});
