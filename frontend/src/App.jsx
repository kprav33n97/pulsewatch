import { useCallback, useEffect, useState } from "react";
import { Activity, LayoutGrid, Globe, CircleAlert, Plus, Search, RefreshCw, Trash2,
  ExternalLink, CircleCheck, CircleX, Clock } from "lucide-react";

const api = async (path, options) => {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.status === 204 ? null : res.json();
};

const STATUS = {
  operational: { label: "Operational", Icon: CircleCheck },
  down: { label: "Down", Icon: CircleX },
  pending: { label: "Awaiting check", Icon: Clock },
};

function Stat({ label, value, tone, Icon }) {
  return (
    <div className="card stat">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div><div className="muted">{label}</div><div className="stat-value">{value}</div></div>
    </div>
  );
}

function AddMonitor({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try { await api("/monitors", { method: "POST", body: JSON.stringify({ name, url }) }); onAdded(); onClose(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Add monitor</h2>
        <label>Name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="My website" /></label>
        <label>URL<input value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary">Add monitor</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [monitors, setMonitors] = useState([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setMonitors(await api("/monitors")); setError(""); }
    catch { setError("Can't reach the API. Is the backend running?"); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const count = (s) => monitors.filter((m) => m.status === s).length;
  const shown = monitors.filter((m) => `${m.name} ${m.url}`.toLowerCase().includes(query.toLowerCase()));

  const recheck = async (id) => { await api(`/monitors/${id}/check`, { method: "POST" }); load(); };
  const remove = async (id) => { if (confirm("Delete this monitor?")) { await api(`/monitors/${id}`, { method: "DELETE" }); load(); } };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><span className="logo"><Activity size={22} /></span><b>pulse</b>watch</div>
        <div className="nav-title">WORKSPACE</div>
        <a className="nav active"><LayoutGrid size={18} />Overview</a>
        <a className="nav"><Globe size={18} />Monitors</a>
        <a className="nav"><CircleAlert size={18} />Incidents</a>
        <div className="workspace"><span className="dot" />Monitoring workspace<small>PulseWatch</small></div>
      </aside>

      <main className="main">
        <div className="crumbs">Workspace / Overview</div>
        <header className="page-head">
          <div><h1>Overview</h1><p className="muted">Monitor your websites and APIs in one place.</p></div>
          <button className="btn primary" onClick={() => setAdding(true)}><Plus size={18} />Add monitor</button>
        </header>

        <section className="stats">
          <Stat label="Total monitors" value={monitors.length} tone="blue" Icon={Globe} />
          <Stat label="Operational" value={count("operational")} tone="green" Icon={CircleCheck} />
          <Stat label="Downtime" value={count("down")} tone="red" Icon={CircleX} />
          <Stat label="Awaiting check" value={count("pending")} tone="amber" Icon={Clock} />
        </section>

        <section className="card table-card">
          <div className="table-head">
            <div><h2>Monitors</h2><p className="muted">Track availability and response times.</p></div>
            <div className="tools">
              <div className="search"><Search size={16} /><input placeholder="Search monitors…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <button className="icon-btn boxed" onClick={load} title="Refresh"><RefreshCw size={16} /></button>
            </div>
          </div>
          {error && <p className="error pad">{error}</p>}
          <table>
            <thead><tr><th>MONITOR</th><th>STATUS</th><th>RESPONSE TIME</th><th>LAST CHECKED</th><th /></tr></thead>
            <tbody>
              {shown.map((m) => {
                const { label, Icon } = STATUS[m.status];
                return (
                  <tr key={m.id}>
                    <td><div className="mon"><span className="mon-icon"><Globe size={18} /></span>
                      <div><b>{m.name}</b><a className="url" href={m.url} target="_blank" rel="noreferrer">{m.url} <ExternalLink size={12} /></a></div></div></td>
                    <td><span className={`pill ${m.status}`}><Icon size={14} />{label}</span></td>
                    <td>{m.responseTimeMs != null ? `${m.responseTimeMs} ms` : "—"}</td>
                    <td>{m.lastChecked ? new Date(m.lastChecked).toLocaleString() : "—"}</td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => recheck(m.id)} title="Check now"><RefreshCw size={16} /></button>
                      <button className="icon-btn" onClick={() => remove(m.id)} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {!shown.length && <tr><td colSpan="5" className="empty">No monitors yet. Click “Add monitor” to start tracking a site.</td></tr>}
            </tbody>
          </table>
          <div className="table-foot"><span>Showing {shown.length} of {monitors.length} monitors</span><span>Auto-refresh every 30 seconds</span></div>
        </section>
        <footer className="muted foot">PulseWatch · Website &amp; API monitoring</footer>
      </main>
      {adding && <AddMonitor onClose={() => setAdding(false)} onAdded={load} />}
    </div>
  );
}
