import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameSelect } from "@/components/game-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface OT {
  id: string;
  gameCode: string;
  gameName: string;
  name: string;
  trainerId: number;
  secretId: number | null;
}

function OTPage() {
  const qc = useQueryClient();
  const [otName, setOtName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [secretId, setSecretId] = useState("");
  const [gameCode, setGameCode] = useState("");

  const { data: ots } = useQuery({
    queryKey: ["ots"],
    queryFn: () => api<OT[]>("/api/ots"),
  });
  const { data: bootstrap } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api<{ games: { id: number; code: string; name: string }[] }>("/api/reference/bootstrap"),
    staleTime: 5 * 60_000,
  });

  const getGameId = (code: string) =>
    bootstrap?.games.find((g) => g.code === code)?.id;

  const createMut = useMutation({
    mutationFn: (body: { gameId: number; name: string; trainerId: number; secretId?: number | null }) =>
      api("/api/ots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ots"] }); setOtName(""); setTrainerId(""); setSecretId(""); setGameCode(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/ots/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ots"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Original Trainers</h1>

      <Card>
        <CardHeader><CardTitle>Add OT</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <GameSelect value={gameCode} onValueChange={setGameCode} placeholder="Select game" includeSpecial={false} />
            <Input placeholder="OT Name" value={otName} onChange={(e) => setOtName(e.target.value)} />
            <Input placeholder="Trainer ID" type="number" value={trainerId} onChange={(e) => setTrainerId(e.target.value)} />
            <Input placeholder="Secret ID (optional)" type="number" value={secretId} onChange={(e) => setSecretId(e.target.value)} />
            <Button
              onClick={() => {
                const id = getGameId(gameCode);
                if (id) createMut.mutate({ gameId: id, name: otName, trainerId: Number(trainerId), secretId: secretId ? Number(secretId) : undefined });
              }}
              disabled={!gameCode || !otName || !trainerId}>
              <Plus className="h-4 w-4" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {ots?.map((ot) => (
          <Card key={ot.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{ot.name}</p>
              <p className="text-sm text-muted-foreground">TID: {ot.trainerId} · {ot.gameName}{ot.secretId != null ? ` · SID: ${ot.secretId}` : ""}</p>
            </div>
            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteMut.mutate(ot.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/ots')({
  component: OTPage,
});
