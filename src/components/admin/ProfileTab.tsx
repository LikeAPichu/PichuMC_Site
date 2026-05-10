import { useEffect, useMemo, useState } from "react";
import { adminFetch, getAdminUser } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Shield, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type ProfileData = {
  id: string;
  username: string;
  role: string;
  role_id?: string | null;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  role_name?: string | null;
  role_color?: string | null;
  linked_discord_roles?: string[];
};

export function ProfileTab() {
  const me = getAdminUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch("my-profile");
        setProfile(data);
      } catch (e: any) {
        toast.error(e?.message || "Profiel laden mislukt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initials = useMemo(() => {
    const name = profile?.username || me?.username || "?";
    return name.slice(0, 2).toUpperCase();
  }, [profile?.username, me?.username]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} gekopieerd`);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  if (loading) return <div className="text-muted-foreground">Laden...</div>;

  return (
    <div className="space-y-5">
      <div className="card-glow rounded-xl bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={profile?.discord_avatar_url || undefined} alt={profile?.discord_username || profile?.username || "Profiel"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground truncate">{profile?.username || me?.username}</h2>
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" /> {profile?.role_name || profile?.role || "Geen rol"}
                </Badge>
                {profile?.discord_id && (
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                    <CheckCircle2 className="w-3 h-3" /> Discord gekoppeld
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Jouw admin-profiel, gekoppelde Discord-account en actieve sitetoegang.</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground rounded-lg border border-border bg-secondary/40 px-3 py-2">
            ID: {profile?.id || me?.id}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-glow rounded-xl bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Site profiel</h3>
          </div>

          <div>
            <Label>Gebruikersnaam</Label>
            <Input value={profile?.username || ""} readOnly className="bg-secondary border-border mt-1" />
          </div>

          <div>
            <Label>Site rol</Label>
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: profile?.role_color || "hsl(var(--primary))" }} />
              <span className="text-sm text-foreground">{profile?.role_name || profile?.role || "Geen rol"}</span>
            </div>
          </div>

          <div>
            <Label>Rol ID</Label>
            <div className="mt-1 flex gap-2">
              <Input value={profile?.role_id || "Niet gekoppeld"} readOnly className="bg-secondary border-border font-mono text-xs" />
              {!!profile?.role_id && (
                <Button type="button" variant="outline" size="icon" onClick={() => copy(profile.role_id!, "Rol ID")}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="card-glow rounded-xl bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Discord profiel</h3>
          </div>

          <div>
            <Label>Discord gebruikersnaam</Label>
            <Input value={profile?.discord_username || "Nog niet gekoppeld"} readOnly className="bg-secondary border-border mt-1" />
          </div>

          <div>
            <Label>Discord user ID</Label>
            <div className="mt-1 flex gap-2">
              <Input value={profile?.discord_id || "Nog niet gekoppeld"} readOnly className="bg-secondary border-border font-mono text-xs" />
              {!!profile?.discord_id && (
                <Button type="button" variant="outline" size="icon" onClick={() => copy(profile.discord_id!, "Discord ID")}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label>Gelinkte Discord rollen</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile?.linked_discord_roles || []).length > 0 ? (
                profile?.linked_discord_roles?.map((roleId) => (
                  <span key={roleId} className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs font-mono text-foreground">
                    {roleId}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Nog geen Discord rollen gesynchroniseerd.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}