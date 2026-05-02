CREATE TABLE public.discord_auth_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL UNIQUE,
  discord_username TEXT,
  discord_global_name TEXT,
  avatar_url TEXT,
  site_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  link_status TEXT NOT NULL DEFAULT 'linked' CHECK (link_status IN ('linked', 'unlinked')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);

ALTER TABLE public.discord_auth_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own discord auth profile"
ON public.discord_auth_profiles
FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own discord auth profile"
ON public.discord_auth_profiles
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own discord auth profile"
ON public.discord_auth_profiles
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

ALTER TABLE public.discord_settings
ADD COLUMN IF NOT EXISTS application_link_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS application_link_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS application_link_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS application_dm_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS auth_button_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS auth_button_label TEXT NOT NULL DEFAULT 'Inloggen met Discord';

CREATE TRIGGER update_discord_auth_profiles_updated_at
BEFORE UPDATE ON public.discord_auth_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value)
VALUES
  ('discord_auth_title', 'Discord account koppelen'),
  ('discord_auth_subtitle', 'Log in met Discord om sneller te solliciteren en je account te koppelen.'),
  ('apply_link_help', 'Koppel eerst je Discord account om te solliciteren.')
ON CONFLICT (key) DO NOTHING;
