import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function SettingsPage() {
  const { user, fetchMe, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [homePlan, setHomePlan] = useState(user?.homePlan ?? "free");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const updateMut = useMutation({
    mutationFn: (body: { name?: string; homePlan?: string }) =>
      api("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchMe();
    },
    onError: (err: any) => setError(err?.message ?? "Update failed"),
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and plan</CardDescription>
        </CardHeader>
        <CardContent className="h-full overflow-auto p-6 max-w-6xl mx-auto space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          </div>

          {/* Pokémon HOME Plan selector */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Pokémon HOME Plan</p>
              <p className="text-sm text-muted-foreground">
                {homePlan === "premium"
                  ? "Premium — up to 6 000 Pokémon across 200 boxes"
                  : "Free — up to 30 Pokémon in 1 box"}
              </p>
            </div>
            <Select
              value={homePlan}
              onValueChange={(v) => {
                setHomePlan(v as "free" | "premium");
                updateMut.mutate({ homePlan: v });
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email (read-only) */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.emailVerifiedAt ? (
              <span className="text-xs text-green-400">Verified</span>
            ) : (
              <span className="text-xs text-amber-400">Unverified</span>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-400">Saved!</p>}

          <Button onClick={() => updateMut.mutate({ name })} disabled={!name || name === user.name}>
            Save Name
          </Button>

          <div className="border-t pt-4">
            <Button variant="destructive" onClick={logout}>Log out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});
