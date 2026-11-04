const db = require("./db");

async function checkUrl(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "PulseWatch/1.0" },
    });
    return { isUp: res.status < 400, statusCode: res.status,
      responseTimeMs: Math.round(performance.now() - start), error: null };
  } catch (err) {
    return { isUp: false, statusCode: null,
      responseTimeMs: Math.round(performance.now() - start),
      error: err.name === "TimeoutError" ? "timeout" : err.message };
  }
}

async function runCheck(monitor) {
  const r = await checkUrl(monitor.url);
  db.prepare(`INSERT INTO checks (monitor_id, is_up, status_code, response_time_ms, error)
              VALUES (?, ?, ?, ?, ?)`)
    .run(monitor.id, r.isUp ? 1 : 0, r.statusCode, r.responseTimeMs, r.error);
  console.log(`[check] ${monitor.url} -> ${r.isUp ? "UP" : "DOWN"} ${r.responseTimeMs}ms`);
  return r;
}

async function runAllChecks() {
  const monitors = db.prepare("SELECT id, url FROM monitors").all();
  await Promise.allSettled(monitors.map(runCheck));
}

function startChecker() {
  const seconds = Number(process.env.CHECK_INTERVAL_SECONDS || 30);
  console.log(`Checker running every ${seconds}s`);
  runAllChecks();
  setInterval(runAllChecks, seconds * 1000);
}

module.exports = { startChecker, runCheck };
