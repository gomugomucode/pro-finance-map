import { describe, it, expect } from "vitest";
import { SmsParserEngine } from "../services/smsParserEngine";
import { OfflineSyncQueueManager } from "../services/offlineSyncQueue";
import { MobilePermissionsManager } from "../services/smsPermissions";

describe("SMS Transaction Parser Engine & Mobile Utilities", () => {
  it("parses Chase Debit SMS correctly", () => {
    const engine = new SmsParserEngine();
    const chaseSms = {
      sender: "CHASE",
      body: "Chase Bank: You spent $45.99 at Starbucks Coffee. Ref: CHX88921.",
      timestamp: 1784800000000,
    };
    const result = engine.parseSms(chaseSms);

    expect(result.amount_minor).toBe(4599);
    expect(result.merchant).toBe("Starbucks Coffee");
    expect(result.confidence_score).toBeGreaterThanOrEqual(80);
  });

  it("parses Amex charge SMS correctly", () => {
    const engine = new SmsParserEngine();
    const amexSms = {
      sender: "AMEX",
      body: "American Express: Charge of USD 189.50 at Target Stores approved",
      timestamp: 1784800010000,
    };
    const result = engine.parseSms(amexSms);

    expect(result.amount_minor).toBe(18950);
    expect(result.merchant).toBe("Target Stores");
  });

  it("detects duplicate SMS messages", () => {
    const engine = new SmsParserEngine();
    const sms = {
      sender: "CHASE",
      body: "Chase Bank: You spent $45.99 at Starbucks Coffee. Ref: CHX88921.",
      timestamp: 1784800000000,
    };
    engine.parseSms(sms);
    const dupResult = engine.parseSms(sms);

    expect(dupResult.is_duplicate).toBe(true);
  });

  it("gracefully ignores OTP / non-transaction messages", () => {
    const engine = new SmsParserEngine();
    const otpSms = {
      sender: "UNKNOWN",
      body: "Your OTP is 481920. Do not share with anyone.",
      timestamp: 1784800020000,
    };
    const result = engine.parseSms(otpSms);

    expect(result.amount).toBeNull();
  });

  it("manages offline sync queue entries", () => {
    const syncManager = new OfflineSyncQueueManager();
    const item = syncManager.enqueue("approve_pending", { id: "test-pending-1" });

    expect(item.status).toBe("pending");
  });
});
