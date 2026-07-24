import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceType } from "@/lib/modules";
import { toast } from "sonner";

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  baseCurrency: string;
  country: string;
  language: string;
  timezone: string;
  workspaceType: WorkspaceType;
  onboardingCompleted: boolean;
  disabledModules: string[];
  betaFeaturesEnabled: boolean;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["user_profile_data"],
    queryFn: async (): Promise<UserProfileData> => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        return {
          id: "guest",
          email: "user@ledgerly.app",
          displayName: "Fintech User",
          avatarUrl: "",
          baseCurrency: "USD",
          country: "United States",
          language: "English",
          timezone: "America/New_York",
          workspaceType: "personal",
          onboardingCompleted: true,
          disabledModules: [],
          betaFeaturesEnabled: false,
        };
      }

      const user = userData.user;
      const meta = user.user_metadata || {};

      // Fallback display name logic: metadata display_name -> full_name -> email username fallback
      let name = meta.display_name || meta.full_name || meta.name;
      if (!name && user.email) {
        const username = user.email.split("@")[0];
        name = username
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      const validWorkspaces: WorkspaceType[] = ["personal", "business", "family", "student", "investor"];
      const rawWorkspace = meta.workspace_type || "personal";
      const workspaceType: WorkspaceType = validWorkspaces.includes(rawWorkspace) ? rawWorkspace : "personal";

      return {
        id: user.id,
        email: user.email || "",
        displayName: name || "Ledgerly User",
        avatarUrl: meta.avatar_url || meta.picture || "",
        baseCurrency: meta.base_currency || "USD",
        country: meta.country || "United States",
        language: meta.language || "English",
        timezone: meta.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        workspaceType,
        onboardingCompleted: meta.onboarding_completed ?? false,
        disabledModules: Array.isArray(meta.disabled_modules) ? meta.disabled_modules : [],
        betaFeaturesEnabled: meta.beta_features_enabled ?? false,
      };
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfileData>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return updates;

      const newMeta: Record<string, any> = {};
      if (updates.displayName !== undefined) newMeta.display_name = updates.displayName;
      if (updates.avatarUrl !== undefined) newMeta.avatar_url = updates.avatarUrl;
      if (updates.baseCurrency !== undefined) newMeta.base_currency = updates.baseCurrency;
      if (updates.country !== undefined) newMeta.country = updates.country;
      if (updates.language !== undefined) newMeta.language = updates.language;
      if (updates.timezone !== undefined) newMeta.timezone = updates.timezone;
      if (updates.workspaceType !== undefined) newMeta.workspace_type = updates.workspaceType;
      if (updates.onboardingCompleted !== undefined) newMeta.onboarding_completed = updates.onboardingCompleted;
      if (updates.disabledModules !== undefined) newMeta.disabled_modules = updates.disabledModules;
      if (updates.betaFeaturesEnabled !== undefined) newMeta.beta_features_enabled = updates.betaFeaturesEnabled;

      const { data, error } = await supabase.auth.updateUser({
        data: newMeta,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profile_data"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Workspace profile updated");
    },
    onError: (err: any) => {
      toast.error(`Update failed: ${err.message || "Error updating workspace"}`);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
