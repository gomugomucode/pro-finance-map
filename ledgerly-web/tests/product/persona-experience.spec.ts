import { test, expect } from "@playwright/test";
import {
  PERSONA_CONFIG,
  getPersonaConfig,
  isCapabilityExcludedForPersona,
} from "../../src/lib/personas";
import { getCapabilitiesForWorkspace } from "../../src/lib/capabilities";

test.describe("Persona & Capability Architecture Test Suite", () => {
  test("Personal Finance persona excludes Wealth and Merchants by default", async () => {
    const caps = getCapabilitiesForWorkspace("personal");
    expect(caps.has("wealth")).toBe(false);
    expect(caps.has("merchants")).toBe(false);
    expect(caps.has("dashboard")).toBe(true);
    expect(caps.has("accounts")).toBe(true);
    expect(caps.has("transactions")).toBe(true);
    expect(caps.has("budgets")).toBe(true);
    expect(caps.has("savings")).toBe(true);
  });

  test("Student Budget persona excludes Wealth, Merchants, and Vault by default", async () => {
    const caps = getCapabilitiesForWorkspace("student");
    expect(caps.has("wealth")).toBe(false);
    expect(caps.has("merchants")).toBe(false);
    expect(caps.has("vault")).toBe(false);
    expect(caps.has("loans")).toBe(true);
    expect(caps.has("budgets")).toBe(true);
  });

  test("Family Finance persona includes Vault, Calendar, and Recurring", async () => {
    const caps = getCapabilitiesForWorkspace("family");
    expect(caps.has("vault")).toBe(true);
    expect(caps.has("calendar")).toBe(true);
    expect(caps.has("recurring")).toBe(true);
    expect(caps.has("wealth")).toBe(false);
  });

  test("Investor persona includes Wealth and Loans, excludes Merchants", async () => {
    const caps = getCapabilitiesForWorkspace("investor");
    expect(caps.has("wealth")).toBe(true);
    expect(caps.has("loans")).toBe(true);
    expect(caps.has("analytics")).toBe(true);
    expect(caps.has("merchants")).toBe(false);
  });

  test("Business Finance persona includes Merchants, Vault, and Analytics", async () => {
    const caps = getCapabilitiesForWorkspace("business");
    expect(caps.has("merchants")).toBe(true);
    expect(caps.has("vault")).toBe(true);
    expect(caps.has("analytics")).toBe(true);
    expect(caps.has("wealth")).toBe(false);
  });

  test("Strict capability resolution enforces persona exclusion boundary", async () => {
    // Attempting to force-enable an excluded capability should be prevented
    const capsWithForcedWealth = getCapabilitiesForWorkspace("personal", ["wealth"]);
    expect(capsWithForcedWealth.has("wealth")).toBe(false);
  });
});
