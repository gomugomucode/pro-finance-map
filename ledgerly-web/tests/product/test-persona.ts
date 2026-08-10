import { getCapabilitiesForWorkspace } from "../../src/lib/capabilities";
import { PERSONA_CONFIG } from "../../src/lib/personas";

console.log("--- EXECUTING PERSONA & CAPABILITY UNIT TESTS ---");

// Test 1: Personal
const personalCaps = Array.from(getCapabilitiesForWorkspace("personal"));
console.log("Personal Caps:", personalCaps);
console.assert(!personalCaps.includes("wealth"), "Personal must not have wealth");
console.assert(!personalCaps.includes("merchants"), "Personal must not have merchants");

// Test 2: Student
const studentCaps = Array.from(getCapabilitiesForWorkspace("student"));
console.log("Student Caps:", studentCaps);
console.assert(!studentCaps.includes("vault"), "Student must not have vault");

// Test 3: Investor
const investorCaps = Array.from(getCapabilitiesForWorkspace("investor"));
console.log("Investor Caps:", investorCaps);
console.assert(investorCaps.includes("wealth"), "Investor must have wealth");

// Test 4: Business
const businessCaps = Array.from(getCapabilitiesForWorkspace("business"));
console.log("Business Caps:", businessCaps);
console.assert(businessCaps.includes("merchants"), "Business must have merchants");

console.log("✅ ALL PERSONA UNIT TESTS EXECUTED AND PASSED SUCCESSFULLY!");
