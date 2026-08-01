import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpriteImage } from "@/components/sprite-image";
import { capitalize } from "@/lib/strings";
import { ArrowLeft } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

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

function PokemonCard({
  pokemon,
}: {
  pokemon: Occupant;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: pokemon.id, data: { slot: pokemon.slot } });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => navigate({ to: "/pokemon/$pokemonId", params: { pokemonId: pokemon.id } })}
      className={`${isDragging ? "opacity-40" : ""}`}
    >
      <Card className="flex aspect-square cursor-grab flex-col items-center justify-center gap-1 p-1.5 transition-colors hover:bg-accent select-none">
        <div className="flex h-24 w-24 items-center justify-center">
          {pokemon.iconUrl ? (
            <SpriteImage src={pokemon.iconUrl!} alt="" className="h-22 w-22 object-contain" loading="lazy" />
          ) : (
            <span className="text-xs text-muted-foreground">?</span>
          )}
        </div>
        <div className="w-full truncate text-center text-[10px] leading-tight">
          <span className={pokemon.isShiny ? "text-purple-400" : ""}>
            {pokemon.nickname ?? capitalize(pokemon.speciesName)}
          </span>
          {pokemon.isFavorite && <span className="text-amber-400">★</span>}
        </div>
      </Card>
    </div>
  );
}

function SlotDropZone({
  slot,
  occupant,
}: {
  slot: number;
  occupant: Occupant | undefined;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slot}` });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-colors ${
        isOver ? "ring-2 ring-primary bg-primary/10" : ""
      }`}
    >
      {occupant ? (
        <PokemonCard pokemon={occupant} />
      ) : (
        <Card className="flex aspect-square flex-col items-center justify-center bg-secondary/30 p-1.5">
          <span className="text-sm text-muted-foreground">{slot}</span>
        </Card>
      )}
    </div>
  );
}

function BoxGrid() {
  const { boxId } = Route.useParams() as { boxId: string };
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["box", boxId],
    queryFn: () => api<{ name: string; occupants: Occupant[] }>(`/api/boxes/${boxId}`),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const patchSlot = async (pokemonId: string, slot: number) => {
    await api(`/api/pokemon/${pokemonId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slot }),
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dragId = active.id as string;
    const targetSlot = Number((over.id as string).replace("slot-", ""));

    const src = data?.occupants.find((o) => o.id === dragId);
    if (!src || src.slot === targetSlot) return;

    await patchSlot(src.id, targetSlot);
    qc.invalidateQueries({ queryKey: ["box", boxId] });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  const slots = Array.from({ length: 30 }, (_, i) => i + 1);
  const occupantMap = new Map(data?.occupants.map((o) => [o.slot, o]));

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-6">
      <div className="flex shrink-0 items-center gap-4 py-4">
        <Link to="/boxes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-xl font-bold">{data?.name ?? "Box"}</h1>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-1.5 pb-4">
          {slots.map((slot) => (
            <SlotDropZone
              key={slot}
              slot={slot}
              occupant={occupantMap.get(slot)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export const Route = createFileRoute('/boxes/$boxId')({
  component: BoxGrid,
});
