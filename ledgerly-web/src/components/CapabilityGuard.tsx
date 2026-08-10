import React from "react";
import { CapabilityId, hasCapability } from "@/lib/capabilities";
import { useProfile } from "@/hooks/useProfile";
import { getPersonaConfig, isCapabilityExcludedForPersona } from "@/lib/personas";
import { ShieldAlert, Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface CapabilityGuardProps {
  capability: CapabilityId;
  children: React.ReactNode;
}

export const CapabilityGuard: React.FC<CapabilityGuardProps> = ({ capability, children }) => {
  const { profile } = useProfile();

  const workspaceType = profile?.workspaceType || "personal";
  const enabledModules = profile?.enabledModules || [];
  const disabledModules = profile?.disabledModules || [];

  const allowed = hasCapability(capability, workspaceType, enabledModules, disabledModules);

  if (allowed) {
    return <>{children}</>;
  }

  const persona = getPersonaConfig(workspaceType);
  const isExcluded = isCapabilityExcludedForPersona(capability, workspaceType);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="card-elevated p-8 space-y-5 border-border bg-card">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            {capability.toUpperCase()} Module Unavailable
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            The <span className="font-semibold text-foreground capitalize">{capability}</span>{" "}
            feature is not active for your{" "}
            <span className="font-semibold text-primary">{persona.name}</span> setup.
            {isExcluded
              ? ` This capability is excluded by default for the ${persona.name} persona to keep your interface clean and focused.`
              : ` You can enable this optional module anytime in your Workspace Settings.`}
          </p>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/settings">
            <Button size="sm" className="text-xs gap-1.5 font-bold bg-primary text-primary-foreground">
              <Settings className="h-3.5 w-3.5" /> Customize Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
