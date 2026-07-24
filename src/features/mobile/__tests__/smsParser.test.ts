import { SmsParserEngine } from '../services/smsParserEngine';
import { OfflineSyncQueueManager } from '../services/offlineSyncQueue';
import { MobilePermissionsManager } from '../services/smsPermissions';

export async function runSmsEngineSelfTest() {
  const engine = new SmsParserEngine();

  // Test 1: Chase Debit SMS Parsing
  const chaseSms = {
    sender: 'CHASE',
    body: 'Chase Bank: You spent $45.99 at Starbucks Coffee. Ref: CHX88921.',
    timestamp: 1784800000000,
  };
  const chaseResult = engine.parseSms(chaseSms);

  if (chaseResult.amount_minor !== 4599) throw new Error('SMS Test 1 Failed: Amount minor mismatch');
  if (chaseResult.merchant !== 'Starbucks Coffee') throw new Error('SMS Test 1 Failed: Merchant mismatch');
  if (chaseResult.confidence_score < 80) throw new Error('SMS Test 1 Failed: Low confidence score');

  // Test 2: Amex Debit SMS Parsing
  const amexSms = {
    sender: 'AMEX',
    body: 'American Express: Charge of USD 189.50 at Target Stores approved',
    timestamp: 1784800010000,
  };
  const amexResult = engine.parseSms(amexSms);

  if (amexResult.amount_minor !== 18950) throw new Error('SMS Test 2 Failed: Amex amount minor mismatch');
  if (amexResult.merchant !== 'Target Stores') throw new Error('SMS Test 2 Failed: Amex merchant mismatch');

  // Test 3: Duplicate Message Detection
  const duplicateResult = engine.parseSms(chaseSms);
  if (!duplicateResult.is_duplicate) throw new Error('SMS Test 3 Failed: Duplicate detection failed');

  // Test 4: Malformed Noisy Message Graceful Handling
  const malformedSms = {
    sender: 'UNKNOWN',
    body: 'Your OTP is 481920. Do not share with anyone.',
    timestamp: 1784800020000,
  };
  const malformedResult = engine.parseSms(malformedSms);

  if (malformedResult.amount !== null) throw new Error('SMS Test 4 Failed: OTP message falsely extracted amount');

  // Test 5: Offline Sync Queue
  const syncManager = new OfflineSyncQueueManager();
  const item = syncManager.enqueue('approve_pending', { id: 'test-pending-1' });
  if (item.status !== 'pending') throw new Error('Sync Queue Test Failed: Item status error');

  // Test 6: Permissions Manager
  const permManager = new MobilePermissionsManager();
  const perms = permManager.getPermissions();
  if (typeof perms.smsGranted !== 'boolean') throw new Error('Permissions Test Failed');

  console.log('✅ SMS Import Engine & Mobile Foundation Self-Tests Passed Cleanly!');
  return true;
}
