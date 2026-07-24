import { toMinor } from "./money";

export interface ParsedTransactionResult {
  raw: string;
  amount: number | null; // e.g. 500
  amountMinor: number | null; // e.g. 50000
  kind: "income" | "expense" | "transfer";
  description: string;
  merchant: string | null;
  categoryKeyword: string | null;
  occurredAt: string; // ISO date string (YYYY-MM-DDTHH:mm)
  matchedCategoryId?: string;
  matchedAccountId?: string;
  matchedToAccountId?: string;
}

// Common category mapping dictionary
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": ["lunch", "dinner", "breakfast", "coffee", "restaurant", "cafe", "burger", "pizza", "food", "snack", "biryani", "momo", "tea", "swiggy", "zomato", "kfc", "mcdonalds"],
  Groceries: ["groceries", "grocery", "supermarket", "mart", "vegetables", "fruits", "milk", "bread", "walmart", "bhatbhateni"],
  Transport: ["fuel", "petrol", "diesel", "gas", "taxi", "cab", "uber", "pathao", "indrive", "bus", "train", "flight", "parking", "toll"],
  Rent: ["rent", "lease", "landlord", "apartment"],
  Utilities: ["utilities", "electricity", "water", "trash", "gas bill"],
  "Internet & Phone": ["internet", "wifi", "phone", "mobile", "recharge", "ncell", "ntc"],
  Subscriptions: ["netflix", "spotify", "prime", "youtube", "cloud", "vps", "domain", "hosting", "github", "chatgpt"],
  Health: ["health", "doctor", "pharmacy", "medicine", "hospital", "clinic", "dental"],
  Shopping: ["shopping", "clothes", "shoes", "amazon", "flipkart", "daraz", "electronics"],
  Entertainment: ["movie", "cinema", "ticket", "game", "gaming", "concert", "bowling"],
  Salary: ["salary", "paycheck", "wage", "stipend", "payroll"],
  Freelance: ["freelance", "upwork", "fiverr", "client", "contract"],
  Investment: ["investment", "stocks", "crypto", "dividend", "crypto"],
  Gift: ["gift", "present"],
};

// Keyword memory storage key
const MEMORY_KEY = "ledgerly_quick_add_memory";

export function getQuickAddMemory(): Record<string, { categoryId?: string; accountId?: string }> {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveQuickAddMemory(merchantOrDesc: string, categoryId?: string, accountId?: string) {
  try {
    const memory = getQuickAddMemory();
    const key = merchantOrDesc.trim().toLowerCase();
    if (!key) return;
    memory[key] = { categoryId, accountId };
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Deterministic Natural Language Parser for Financial Entry.
 * Parses input strings like:
 * - "500 lunch"
 * - "800 fuel yesterday"
 * - "35000 salary"
 * - "250 coffee at Starbucks"
 * - "1500 rent 2 days ago"
 */
export function parseQuickInput(
  input: string,
  categories: Array<{ id: string; name: string; kind: string }>,
  accounts: Array<{ id: string; name: string }>
): ParsedTransactionResult {
  const text = input.trim();
  let amount: number | null = null;
  let kind: "income" | "expense" | "transfer" = "expense";
  let occurredAt = new Date();
  let descriptionParts: string[] = [];
  let categoryKeyword: string | null = null;
  let matchedCategoryId: string | undefined = undefined;
  let matchedAccountId: string | undefined = undefined;
  let matchedToAccountId: string | undefined = undefined;

  if (!text) {
    return {
      raw: "",
      amount: null,
      amountMinor: null,
      kind: "expense",
      description: "",
      merchant: null,
      categoryKeyword: null,
      occurredAt: new Date().toISOString().slice(0, 16),
    };
  }

  const tokens = text.split(/\s+/);

  // 1. Date Detection ("yesterday", "today", "tomorrow", "X days ago")
  const lowerText = text.toLowerCase();

  if (lowerText.includes("yesterday")) {
    occurredAt.setDate(occurredAt.getDate() - 1);
  } else if (lowerText.includes("2 days ago")) {
    occurredAt.setDate(occurredAt.getDate() - 2);
  } else if (lowerText.includes("3 days ago")) {
    occurredAt.setDate(occurredAt.getDate() - 3);
  }

  // 2. Token Scanning for Amount & Keywords
  for (const token of tokens) {
    const cleanToken = token.replace(/[$₹Rs\s,]/g, "");
    const lowerToken = token.toLowerCase();

    // Skip date words
    if (["yesterday", "today", "tomorrow", "ago", "days"].includes(lowerToken)) {
      continue;
    }

    // Check if token is amount (e.g. "500", "800.50", "15k")
    let numVal: number | null = null;
    if (/^\d+(\.\d+)?$/i.test(cleanToken)) {
      numVal = parseFloat(cleanToken);
    } else if (/^\d+k$/i.test(cleanToken)) {
      numVal = parseFloat(cleanToken.replace(/k/i, "")) * 1000;
    }

    if (numVal !== null && amount === null && !isNaN(numVal)) {
      amount = numVal;
      continue;
    }

    // Check for explicit transfer keywords
    if (["transfer", "to"].includes(lowerToken)) {
      kind = "transfer";
      continue;
    }

    descriptionParts.push(token);
  }

  const description = descriptionParts.join(" ");
  const cleanDescLower = description.toLowerCase();

  // 3. Category & Kind Inference
  // Check memory first
  const memory = getQuickAddMemory();
  const memoryMatch = memory[cleanDescLower];
  if (memoryMatch?.categoryId) {
    matchedCategoryId = memoryMatch.categoryId;
  }
  if (memoryMatch?.accountId) {
    matchedAccountId = memoryMatch.accountId;
  }

  // Infer Kind (Income vs Expense)
  const incomeKeywords = ["salary", "paycheck", "income", "freelance", "stipend", "bonus", "dividend", "received", "gift", "refund"];
  if (incomeKeywords.some((kw) => cleanDescLower.includes(kw))) {
    kind = "income";
  }

  // Match Category Name or Keyword Dictionaries
  if (!matchedCategoryId) {
    // Exact category name match
    const categoryDirectMatch = categories.find((c) =>
      cleanDescLower.includes(c.name.toLowerCase()) && c.kind === kind
    );

    if (categoryDirectMatch) {
      matchedCategoryId = categoryDirectMatch.id;
      categoryKeyword = categoryDirectMatch.name;
    } else {
      // Keyword dictionary match
      for (const [groupName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => cleanDescLower.includes(kw))) {
          categoryKeyword = groupName;
          const found = categories.find(
            (c) => c.name.toLowerCase().includes(groupName.toLowerCase()) || groupName.toLowerCase().includes(c.name.toLowerCase())
          );
          if (found) {
            matchedCategoryId = found.id;
            // Align kind with category
            if (found.kind === "income" || found.kind === "expense") {
              kind = found.kind as "income" | "expense";
            }
          }
          break;
        }
      }
    }
  }

  // 4. Default account selection
  if (!matchedAccountId && accounts.length > 0) {
    matchedAccountId = accounts[0].id;
  }

  return {
    raw: input,
    amount,
    amountMinor: amount ? toMinor(amount) : null,
    kind,
    description: description || "Quick Transaction",
    merchant: description ? description.split(" ")[0] : null,
    categoryKeyword,
    occurredAt: occurredAt.toISOString().slice(0, 16),
    matchedCategoryId,
    matchedAccountId,
    matchedToAccountId,
  };
}

export interface MerchantItem {
  id: string;
  name: string;
  normalized_name?: string;
  visit_count?: number;
  last_used_at?: string;
  default_category_id?: string | null;
  default_account_id?: string | null;
  default_payment_method?: string | null;
}

/**
 * Ranks merchant suggestions based on Query Similarity, Visit Frequency, and Recency.
 * Instant search under <5ms.
 */
export function rankMerchantSuggestions(
  query: string,
  merchants: MerchantItem[]
): MerchantItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return merchants.slice(0, 8);

  const scored = merchants.map((m) => {
    const name = m.name.toLowerCase();
    let similarityScore = 0;

    if (name === q) similarityScore = 1.0;
    else if (name.startsWith(q)) similarityScore = 0.8;
    else if (name.includes(q)) similarityScore = 0.5;

    // Frequency boost
    const visitScore = Math.min(1.0, (m.visit_count || 1) / 20);

    // Recency boost (last 30 days = higher score)
    let recencyScore = 0.5;
    if (m.last_used_at) {
      const daysAgo = (Date.now() - new Date(m.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
      recencyScore = Math.max(0, 1 - daysAgo / 30);
    }

    const totalScore = similarityScore * 0.6 + visitScore * 0.25 + recencyScore * 0.15;
    return { merchant: m, score: totalScore, similarityScore };
  });

  return scored
    .filter((item) => item.similarityScore > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.merchant)
    .slice(0, 8);
}

