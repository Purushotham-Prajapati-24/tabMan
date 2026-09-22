import express from "express";
import cors from "cors";
import { triageTicket, decidePriority } from "./triage.js";
import { scoreTabRelevance } from "./tab-relevance.js";

const app = express();
// The Jev Tab Cleaner extension calls this server from a chrome-extension://
// origin, which is cross-origin from Express's point of view.
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.post("/api/triage", async (req, res) => {
  const message = (req.body?.message || "").trim();
  if (!message) return res.status(422).json({ error: "message is required" });

  try {
    const result = await triageTicket(message);
    res.json({ ...result, priority: decidePriority(result) });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "triage failed", detail: String(err?.message || err) });
  }
});

app.post("/api/tabs-relevance", async (req, res) => {
  const task = (req.body?.task || "").trim();
  const tabs = Array.isArray(req.body?.tabs) ? req.body.tabs : [];
  if (!task) return res.status(422).json({ error: "task is required" });
  if (tabs.length === 0) return res.status(422).json({ error: "tabs must be a non-empty array" });

  try {
    const result = await scoreTabRelevance(task, tabs);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "tab relevance scoring failed", detail: String(err?.message || err) });
  }
});

const port = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Inbox triage running at http://localhost:${port}`));
}

export default app;

