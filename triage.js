import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// minimal .env loader so we don't need an extra dependency
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = join(__dirname, ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // no .env file; rely on real environment variables
}

import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const DEPARTMENTS = {
  billing: "Charges, invoices, refunds, subscription/payment problems",
  technical: "Product bugs, errors, outages, how-something-works questions",
  shipping: "Delivery status, delays, lost or damaged packages, tracking",
  account: "Login, password reset, account access, profile changes",
  sales: "Pricing questions, upgrades, new purchases, plan comparisons",
  other: "Anything that does not clearly fit the above",
};

/**
 * Runs one batched TypeSafe System One call over a customer message and
 * returns typed judgments an application can route on directly.
 */
export async function triageTicket(message) {
  const response = await client.systemOne({
    state: { message },
    questions: {
      department: choice(
        "Which team should own this support ticket?",
        DEPARTMENTS
      ),
      urgency: score(
        "How urgently does this ticket need a human response?",
        [
          "No rush; informational or a minor question",
          "Normal priority; standard turnaround is fine",
          "Elevated; customer is inconvenienced or blocked",
          "Urgent; customer is angry, at risk of churn, or losing money",
          "Critical; outage, safety, legal, or active data/financial harm",
        ]
      ),
      angry: noul(
        "Is the customer expressing anger or frustration in this message?"
      ),
      churnRisk: noul(
        "Does this message suggest the customer might cancel or leave?"
      ),
      needsHuman: noul(
        "Does this message require a human agent rather than an automated reply " +
          "(e.g. it is ambiguous, emotionally charged, or about money/legal matters)?"
      ),
    },
  });

  const a = response.answers;
  return {
    department: a.department.choice,
    departmentConfidence: a.department.confidence,
    urgencyScore: a.urgency.score,
    urgencyLegend: a.urgency.legend,
    angry: a.angry.noul,
    churnRisk: a.churnRisk.noul,
    needsHuman: a.needsHuman.noul,
    usage: response.usage,
  };
}

/** Simple policy layer: code owns the thresholds, not the model. */
export function decidePriority(result) {
  if (result.needsHuman > 0.7 || result.urgencyScore >= 3.5) return "P0 — escalate now";
  if (result.angry > 0.6 || result.churnRisk > 0.6 || result.urgencyScore >= 2) {
    return "P1 — human review within the hour";
  }
  return "P2 — normal queue";
}
