const express = require("express");
const db = require("./db");
const { runCheck } = require("./checker");

const router = express.Router();

const LIST_SQL = `
  SELECT m.id, m.name, m.url, c.is_up, c.response_time_ms, c.checked_at
  FROM monitors m
  LEFT JOIN checks c ON c.id = (
    SELECT id FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC, id DESC LIMIT 1)
  ORDER BY m.created_at DESC, m.id DESC`;

const toMonitor = (r) => ({
  id: r.id, name: r.name, url: r.url,
  status: r.checked_at ? (r.is_up ? "operational" : "down") : "pending",
  responseTimeMs: r.response_time_ms,
  lastChecked: r.checked_at,
});

router.get("/monitors", (req, res) => res.json(db.prepare(LIST_SQL).all().map(toMonitor)));

router.post("/monitors", (req, res) => {
  const { name, url } = req.body || {};
  if (!name || !url) return res.status(400).json({ error: "name and url are required" });
  try {
    if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: "url must be a valid http(s) URL" });
  }
  const { lastInsertRowid } = db.prepare("INSERT INTO monitors (name, url) VALUES (?, ?)").run(name, url);
  const monitor = { id: Number(lastInsertRowid), name, url };
  runCheck(monitor).catch(() => {});
  res.status(201).json(monitor);
});

router.delete("/monitors/:id", (req, res) => {
  const { changes } = db.prepare("DELETE FROM monitors WHERE id = ?").run(req.params.id);
  if (!changes) return res.status(404).json({ error: "monitor not found" });
  res.status(204).end();
});

router.post("/monitors/:id/check", async (req, res) => {
  const m = db.prepare("SELECT id, url FROM monitors WHERE id = ?").get(req.params.id);
  if (!m) return res.status(404).json({ error: "monitor not found" });
  res.json(await runCheck(m));
});

router.get("/monitors/:id/checks", (req, res) => {
  res.json(db.prepare(`SELECT is_up, status_code, response_time_ms, error, checked_at
    FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 100`).all(req.params.id));
});

router.get("/stats", (req, res) => {
  const list = db.prepare(LIST_SQL).all().map(toMonitor);
  const count = (s) => list.filter((m) => m.status === s).length;
  res.json({ total: list.length, operational: count("operational"), down: count("down"), pending: count("pending") });
});

module.exports = router;
