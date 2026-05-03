import { useEffect, useMemo, useState } from "react";
import { adminFetch, getAdminUser } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Link2, Plus, Save, Trash2, Users2, ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type RoleMapping = { discord_role_id: string; site_role_id: string };

interface Settings {
  discord_auth_client_id?: string;
  discord_auth_client_secret?: string;
  discord_auth_client_secret_set?: string;
  discord_auth_redirect_url?: string;
  discord_auth_button_enabled?: string;
  discord_auth_button_label?: string;
  discord_auth_application_link_enabled?: string;
  discord_auth_application_link_required?: string;
  discord_auth_application_link_url?: string;
  discord_auth_application_dm_enabled?: string;
  discord_auth_role_link_enabled?: string;
  discord_auth_role_mappings?: string;
  discord_auth_title?: string;
  discord_auth_subtitle?: string;
}

const bool = (v?: string) => v === "1" || v === "true";

export function AuthTab() {
  const user = getAdminUser();
  const isOwner = user?.role === "eigenaar";
  const canManage = isOwner || user?.permissions?.auth_manage === true;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [secretSet, setSecretSet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [siteRoles, setSiteRoles] = useState<{ id: string; name: string; color: string }[]>([]);

  const [s, setS] = useState<Settings>({});
  const [mappings, setMappings] = useState<RoleMapping[]>([]);

  const defaultRedirect = useMemo(() => {
    const project = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || "";
    return `https://${project}.supabase.co/functions/v1/admin?action=discord-oauth-callback`;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [authRes, rolesRes] = await Promise.all([
          adminFetch("auth-settings"),
          adminFetch("roles").catch(() => []),
        ]);
        const settings: Settings = authRes?.settings || {};
        setSecretSet(settings.discord_auth_client_secret_set === "1");
        setS({
          discord_auth_client_id: settings.discord_auth_client_id || "",
          discord_auth_client_secret: "",
          discord_auth_redirect_url: settings.discord_auth_redirect_url || defaultRedirect,
          discord_auth_button_enabled: settings.discord_auth_button_enabled ?? "1",
          discord_auth_button_label: settings.discord_auth_button_label || "Inloggen met Discord",
          discord_auth_application_link_enabled: settings.discord_auth_application_link_enabled ?? "1",
          discord_auth_application_link_required: settings.discord_auth_application_link_required ?? "0",
          discord_auth_application_link_url: settings.discord_auth_application_link_url || "",
          discord_auth_application_dm_enabled: settings.discord_auth_application_dm_enabled ?? "1",
          discord_auth_role_link_enabled: settings.discord_auth_role_link_enabled ?? "0",
          discord_auth_title: settings.discord_auth_title || "Discord account koppelen",
          discord_auth_subtitle: settings.discord_auth_subtitle || "Log in met Discord om sneller te solliciteren.",
        });
        try {
          const parsed = JSON.parse(settings.discord_auth_role_mappings || "[]");
          setMappings(Array.isArray(parsed) ? parsed : []);
        } catch { setMappings([]); }

        if (Array.isArray(rolesRes)) setSiteRoles(rolesRes);
      } catch (e: any) {
        toast.error(e?.message || "Kon instellingen niet laden");
      } finally {
        setLoading(false);
      }
    })();
  }, [defaultRedirect]);

  const update = (k: keyof Settings, v: string) => setS((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: keyof Settings, v: boolean) => update(k, v ? "1" : "0");

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        discord_auth_client_id: s.discord_auth_client_id || "",
        discord_auth_redirect_url: s.discord_auth_redirect_url || "",
        discord_auth_button_enabled: s.discord_auth_button_enabled || "0",
        discord_auth_button_label: s.discord_auth_button_label || "",
        discord_auth_application_link_enabled: s.discord_auth_application_link_enabled || "0",
        discord_auth_application_link_required: s.discord_auth_application_link_required || "0",
        discord_auth_application_link_url: s.discord_auth_application_link_url || "",
        discord_auth_application_dm_enabled: s.discord_auth_application_dm_enabled || "0",
        discord_auth_role_link_enabled: s.discord_auth_role_link_enabled || "0",
        discord_auth_role_mappings: JSON.stringify(mappings),
        discord_auth_title: s.discord_auth_title || "",
        discord_auth_subtitle: s.discord_auth_subtitle || "",
      };
      if (s.discord_auth_client_secret && s.discord_auth_client_secret.trim()) {
        payload.discord_auth_client_secret = s.discord_auth_client_secret.trim();
      }
      await adminFetch("update-auth-settings", { settings: payload });
      toast.success("Instellingen opgeslagen");
      if (payload.discord_auth_client_secret) {
        setSecretSet(true);
        update("discord_auth_client_secret", "");
      }
    } catch (e: any) {
      toast.error(e?.message || "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const copyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(s.discord_auth_redirect_url || defaultRedirect);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const linkRequired = bool(s.discord_auth_application_link_required);
  const linkEnabled = bool(s.discord_auth_application_link_enabled);

  if (loading) return <div className="text-muted-foreground">Laden...</div>;

  const Section = ({ icon: Icon, title, desc, children }: any) => (
    <div className="card-glow rounded-xl bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-foreground text-base sm:text-lg">{title}</h3>
          {desc && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const fieldDisabled = !canManage;

  return (
    <div className="space-y-5">
      {!canManage && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          Je hebt alleen kijk-rechten. Vraag een eigenaar om de "Auth Beheren" permissie.
        </div>
      )}

      {/* OAuth credentials */}
      <Section
        icon={KeyRound}
        title="Discord OAuth2 credentials"
        desc="Maak een Application aan op discord.com/developers/applications, kopieer hier de Client ID en Secret en zet de Redirect URL bij OAuth2 → Redirects."
      >
        <div>
          <Label>Client ID</Label>
          <Input
            disabled={fieldDisabled}
            value={s.discord_auth_client_id || ""}
            onChange={(e) => update("discord_auth_client_id", e.target.value)}
            placeholder="Bijv. 1234567890123456789"
            className="bg-secondary border-border mt-1"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            Client Secret
            {secretSet && (
              <span className="text-[10px] uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Ingesteld
              </span>
            )}
          </Label>
          <div className="relative mt-1">
            <Input
              disabled={fieldDisabled}
              type={showSecret ? "text" : "password"}
              value={s.discord_auth_client_secret || ""}
              onChange={(e) => update("discord_auth_client_secret", e.target.value)}
              placeholder={secretSet ? "•••••••••••••••• (laat leeg om niet te wijzigen)" : "Plak je client secret"}
              className="pr-10 bg-secondary border-border"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSecret((v) => !v)}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label>Redirect URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              disabled={fieldDisabled}
              value={s.discord_auth_redirect_url || ""}
              onChange={(e) => update("discord_auth_redirect_url", e.target.value)}
              className="bg-secondary border-border font-mono text-xs"
            />
            <Button type="button" variant="outline" size="icon" onClick={copyRedirect} title="Kopieer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Plak deze URL in Discord Developer Portal → OAuth2 → Redirects.
          </p>
        </div>
      </Section>

      {/* Login button */}
      <Section icon={ShieldCheck} title="Discord login knop" desc="Toon een 'Inloggen met Discord' knop op de site.">
        <div className="flex items-center justify-between">
          <div>
            <Label>Knop aan/uit</Label>
            <p className="text-xs text-muted-foreground">Als uit, dan is de Discord login niet zichtbaar.</p>
          </div>
          <Switch
            disabled={fieldDisabled}
            checked={bool(s.discord_auth_button_enabled)}
            onCheckedChange={(v) => toggle("discord_auth_button_enabled", v)}
          />
        </div>
        <div>
          <Label>Knop tekst</Label>
          <Input
            disabled={fieldDisabled || !bool(s.discord_auth_button_enabled)}
            value={s.discord_auth_button_label || ""}
            onChange={(e) => update("discord_auth_button_label", e.target.value)}
            className="bg-secondary border-border mt-1"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Sectie titel</Label>
            <Input
              disabled={fieldDisabled}
              value={s.discord_auth_title || ""}
              onChange={(e) => update("discord_auth_title", e.target.value)}
              className="bg-secondary border-border mt-1"
            />
          </div>
          <div>
            <Label>Sectie ondertitel</Label>
            <Input
              disabled={fieldDisabled}
              value={s.discord_auth_subtitle || ""}
              onChange={(e) => update("discord_auth_subtitle", e.target.value)}
              className="bg-secondary border-border mt-1"
            />
          </div>
        </div>
      </Section>

      {/* Application link */}
      <Section
        icon={Link2}
        title="Sollicitatie koppeling"
        desc="Bepaal of sollicitanten hun Discord moeten koppelen voordat ze kunnen solliciteren of een DM kunnen ontvangen."
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Knop 'Discord koppelen' tonen op /apply</Label>
            <p className="text-xs text-muted-foreground">Als uit, dan kan je niet linken vanaf de sollicitatie pagina.</p>
          </div>
          <Switch
            disabled={fieldDisabled}
            checked={linkEnabled}
            onCheckedChange={(v) => toggle("discord_auth_application_link_enabled", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Linken verplicht om te solliciteren</Label>
            <p className="text-xs text-muted-foreground">
              Wanneer aan: zonder gekoppelde Discord kun je het sollicitatie formulier niet versturen.
            </p>
          </div>
          <Switch
            disabled={fieldDisabled || !linkEnabled}
            checked={linkRequired}
            onCheckedChange={(v) => toggle("discord_auth_application_link_required", v)}
          />
        </div>

        <div>
          <Label>Custom link URL (optioneel)</Label>
          <Input
            disabled={fieldDisabled || !linkEnabled}
            value={s.discord_auth_application_link_url || ""}
            onChange={(e) => update("discord_auth_application_link_url", e.target.value)}
            placeholder="Laat leeg om de standaard OAuth flow te gebruiken"
            className="bg-secondary border-border mt-1"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Vul een eigen URL in (bijv. discord invite of externe pagina) als je niet de standaard OAuth flow wilt.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <Label>DM versturen naar gekoppelde sollicitanten</Label>
            <p className="text-xs text-muted-foreground">Als uit, dan stuurt de bot geen automatische DM bij sollicitaties.</p>
          </div>
          <Switch
            disabled={fieldDisabled}
            checked={bool(s.discord_auth_application_dm_enabled)}
            onCheckedChange={(v) => toggle("discord_auth_application_dm_enabled", v)}
          />
        </div>
      </Section>

      {/* Role linking */}
      <Section
        icon={Users2}
        title="Site rol linken met Discord rol"
        desc="Wanneer iemand inlogt met Discord en een van deze rollen heeft, krijgt hij/zij automatisch de gekoppelde site rol."
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Role linking aan/uit</Label>
            <p className="text-xs text-muted-foreground">Heeft de bot Guild Members Intent + 'Read Members' permissie nodig.</p>
          </div>
          <Switch
            disabled={fieldDisabled}
            checked={bool(s.discord_auth_role_link_enabled)}
            onCheckedChange={(v) => toggle("discord_auth_role_link_enabled", v)}
          />
        </div>

        <div className={`space-y-2 ${!bool(s.discord_auth_role_link_enabled) ? "opacity-60 pointer-events-none" : ""}`}>
          {mappings.length === 0 && (
            <p className="text-xs text-muted-foreground">Nog geen mappings — voeg er één toe.</p>
          )}
          {mappings.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-secondary/40 border border-border rounded-lg p-2">
              <Input
                disabled={fieldDisabled}
                value={m.discord_role_id}
                onChange={(e) => setMappings((arr) => arr.map((x, j) => j === i ? { ...x, discord_role_id: e.target.value } : x))}
                placeholder="Discord Role ID"
                className="bg-card border-border flex-1 font-mono text-xs"
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">→</span>
              <select
                disabled={fieldDisabled}
                value={m.site_role_id}
                onChange={(e) => setMappings((arr) => arr.map((x, j) => j === i ? { ...x, site_role_id: e.target.value } : x))}
                className="flex-1 bg-card border border-border rounded-md h-10 px-3 text-sm"
              >
                <option value="">— Site rol —</option>
                {siteRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Button
                disabled={fieldDisabled}
                type="button" variant="outline" size="icon"
                onClick={() => setMappings((arr) => arr.filter((_, j) => j !== i))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            disabled={fieldDisabled}
            type="button" variant="outline" className="gap-2"
            onClick={() => setMappings((arr) => [...arr, { discord_role_id: "", site_role_id: "" }])}
          >
            <Plus className="w-4 h-4" /> Mapping toevoegen
          </Button>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 bg-background/80 backdrop-blur border-t border-border flex justify-end">
        <Button onClick={save} disabled={!canManage || saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "Opslaan..." : "Alles opslaan"}
        </Button>
      </div>
    </div>
  );
}
