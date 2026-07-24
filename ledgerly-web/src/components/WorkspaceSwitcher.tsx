import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { WORKSPACE_CONFIGS, WorkspaceType } from "@/lib/modules";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Sparkles } from "lucide-react";

export const WorkspaceSwitcher: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const currentWorkspace = profile?.workspaceType || "personal";
  const currentConfig = WORKSPACE_CONFIGS[currentWorkspace];

  const handleSelect = (ws: WorkspaceType) => {
    if (ws === currentWorkspace) return;
    updateProfile({ workspaceType: ws });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-accent text-xs font-semibold text-foreground transition shadow-xs"
        >
          <span className="text-base">{currentConfig.icon}</span>
          <span className="font-bold">{currentConfig.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            {currentConfig.badge}
          </Badge>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 bg-card border-border p-1.5">
        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Switch Workspace Archetype
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        {(Object.keys(WORKSPACE_CONFIGS) as WorkspaceType[]).map((key) => {
          const config = WORKSPACE_CONFIGS[key];
          const isSelected = key === currentWorkspace;

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleSelect(key)}
              className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer text-xs ${
                isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-accent"
              }`}
            >
              <span className="text-lg">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{config.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{config.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
