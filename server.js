import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { scoreTabRelevance } from "./tab-relevance.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
// The Jev Tab Cleaner extension calls this server from a chrome-extension://
// origin, which is cross-origin from Express's point of view.
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (req.url.startsWith("/server.js")) {
    req.url = req.url.replace(/^\/server\.js/, "") || "/";
  }
  next();
});
app.use(express.static(join(__dirname, "public")));

app.get("/", (req, res) => {
  const indexPath = join(__dirname, "public", "index.html");
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    name: "Jev Tab Cleaner API",
    status: "running",
    endpoints: ["/api/tabs-relevance", "/api/health"]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
  app.listen(port, () => console.log(`Jev Tab Cleaner API running at http://localhost:${port}`));
}

export default app;

