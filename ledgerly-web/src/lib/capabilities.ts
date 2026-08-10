import { WorkspaceType, MODULE_REGISTRY, SystemModule } from "./modules";
import { PERSONA_CONFIG, getPersonaConfig, isCapabilityExcludedForPersona } from "./personas";

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

export function getCapabilitiesForWorkspace(
  workspaceType: WorkspaceType = "personal",
  enabledModules: string[] = [],
  disabledModules: string[] = [],
): Set<CapabilityId> {
  const persona = getPersonaConfig(workspaceType);
  const capsSet = new Set<CapabilityId>(persona.coreCapabilities);

  // Add user-enabled optional modules (if not strictly excluded by persona)
  for (const modId of enabledModules) {
    const capId = modId as CapabilityId;
    if (!persona.excludedCapabilities.includes(capId)) {
      capsSet.add(capId);
    }
  }

  // Remove user-disabled modules (core mandatory caps stay)
  for (const modId of disabledModules) {
    const capId = modId as CapabilityId;
    if (
      capId !== "dashboard" &&
      capId !== "accounts" &&
      capId !== "transactions" &&
      capId !== "settings"
    ) {
      capsSet.delete(capId);
    }
  }

  // Mandatory system safeguards
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

export { PERSONA_CONFIG, getPersonaConfig, isCapabilityExcludedForPersona };
