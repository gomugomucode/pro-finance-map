import { WorkspaceType, MODULE_REGISTRY, SystemModule } from "./modules";

export type CapabilityId =
  | "dashboard"
  | "insights"
  | "accounts"
  | "transactions"
  | "categories"
  | "vault"
  | "wealth"
  | "budgets"
  | "savings"
  | "loans"
  | "recurring"
  | "subscriptions"
  | "merchants"
  | "calendar"
  | "analytics"
  | "import-export"
  | "health"
  | "feedback"
  | "timeline"
  | "settings";

export const DEFAULT_WORKSPACE_CAPABILITIES: Record<WorkspaceType, CapabilityId[]> = {
  personal: [
    "dashboard",
    "insights",
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "savings",
    "vault",
    "analytics",
    "timeline",
    "health",
    "feedback",
    "settings",
  ],
  student: [
    "dashboard",
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "savings",
    "subscriptions",
    "loans",
    "timeline",
    "health",
    "feedback",
    "settings",
  ],
  family: [
    "dashboard",
    "insights",
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "savings",
    "vault",
    "calendar",
    "recurring",
    "timeline",
    "health",
    "feedback",
    "settings",
  ],
  investor: [
    "dashboard",
    "insights",
    "accounts",
    "transactions",
    "categories",
    "wealth",
    "loans",
    "analytics",
    "import-export",
    "vault",
    "health",
    "feedback",
    "settings",
  ],
  business: [
    "dashboard",
    "insights",
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "merchants",
    "vault",
    "analytics",
    "recurring",
    "subscriptions",
    "import-export",
    "health",
    "feedback",
    "settings",
  ],
};

export function getCapabilitiesForWorkspace(
  workspaceType: WorkspaceType = "personal",
  enabledModules: string[] = [],
  disabledModules: string[] = [],
): Set<CapabilityId> {
  const defaultCaps =
    DEFAULT_WORKSPACE_CAPABILITIES[workspaceType] || DEFAULT_WORKSPACE_CAPABILITIES.personal;
  const capsSet = new Set<CapabilityId>(defaultCaps);

  // Add explicitly user-enabled modules
  for (const modId of enabledModules) {
    capsSet.add(modId as CapabilityId);
  }

  // Remove explicitly user-disabled modules
  for (const modId of disabledModules) {
    capsSet.delete(modId as CapabilityId);
  }

  // Always keep core mandatory capabilities
  capsSet.add("dashboard");
  capsSet.add("accounts");
  capsSet.add("transactions");
  capsSet.add("settings");

  return capsSet;
}

export function hasCapability(
  capability: CapabilityId,
  workspaceType: WorkspaceType = "personal",
  enabledModules: string[] = [],
  disabledModules: string[] = [],
): boolean {
  const caps = getCapabilitiesForWorkspace(workspaceType, enabledModules, disabledModules);
  return caps.has(capability);
}

export function getFilteredModulesForWorkspace(
  workspaceType: WorkspaceType = "personal",
  enabledModules: string[] = [],
  disabledModules: string[] = [],
): SystemModule[] {
  const caps = getCapabilitiesForWorkspace(workspaceType, enabledModules, disabledModules);
  return MODULE_REGISTRY.filter((mod) => caps.has(mod.id as CapabilityId));
}
