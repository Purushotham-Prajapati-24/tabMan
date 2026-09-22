import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

// System One evaluates every question in the map in parallel over the same
// state, so a request can safely stay well under any practical batch size.
const MAX_TABS_PER_CALL = 60;

/**
 * tabs: [{ id, title, url }]
 * task: free-text description of what the user is currently working on
 *
 * Returns tabs annotated with `relevant` (noul, 0-1) and a `keep` boolean
 * decided by a fixed threshold — the model supplies the judgment, the
 * threshold is a policy choice made in code.
 */
export async function scoreTabRelevance(task, tabs) {
  const trimmed = tabs.slice(0, MAX_TABS_PER_CALL);

  const state = {
    task,
    tabs: trimmed.map((t) => ({ title: t.title, url: t.url })),
  };

  const questions = {};
  trimmed.forEach((_, i) => {
    questions[`t${i}`] = noul(
      `Is the browser tab described by \`tabs[${i}].title\` and \`tabs[${i}].url\` ` +
        "relevant to, useful for, or actively part of the user's current task, " +
        "given in `task`? Relevant includes reference material, docs, tickets, " +
        "communication, or tools directly tied to the task — not just loosely " +
        "similar topics."
    );
  });

  const response = await client.systemOne({ state, questions });

  const THRESHOLD = 0.5;
  const results = trimmed.map((tab, i) => {
    const relevant = response.answers[`t${i}`].noul;
    return { ...tab, relevant, keep: relevant >= THRESHOLD };
  });

  return { results, usage: response.usage, skipped: tabs.length - trimmed.length };
}
