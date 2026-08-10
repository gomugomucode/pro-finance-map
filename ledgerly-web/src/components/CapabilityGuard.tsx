import React from "react";
import { CapabilityId, hasCapability } from "@/lib/capabilities";
import { useProfile } from "@/hooks/useProfile";
import { WORKSPACE_CONFIGS } from "@/lib/modules";
import { ShieldAlert, Sparkles, Settings } from "lucide-react";
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

  const config = WORKSPACE_CONFIGS[workspaceType] || WORKSPACE_CONFIGS.personal;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="card-elevated p-8 space-y-5 border-border">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Feature Not Active in Your Workspace
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            The <span className="font-semibold text-foreground capitalize">{capability}</span>{" "}
            module is not part of your current{" "}
            <span className="font-semibold text-primary">{config.name}</span> setup.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/settings">
            <Button size="sm" className="text-xs gap-1.5 font-bold">
              <Settings className="h-3.5 w-3.5" /> Customize Capabilities
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
