/**
 * Kalshi Trading Dashboard — Redesigned
 * Clean, tight layout with refined visual hierarchy
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertCircle, CheckCircle, XCircle, Shield, 
  Zap, Clock, RefreshCw, Loader2, TrendingUp, Play, BarChart3, DollarSign
} from 'lucide-react';

const API_BASE = 'https://live-trader-164814074525.us-central1.run.app';

async function apiRequest(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

// ── Metric Pill ─────────────────────────────────────────────
const MetricPill = ({ label, value, sub, accent = 'emerald' }) => {
  const colors = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20',
    sky: 'from-sky-500/10 to-sky-500/5 border-sky-500/20',
  };
  const textColors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    sky: 'text-sky-400',
  };
  return (
    <div className={`bg-gradient-to-b ${colors[accent]} border rounded-lg px-4 py-3`}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      <p className={`text-xl font-semibold font-mono ${textColors[accent]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
};

// ── Positions ───────────────────────────────────────────────
function PositionsTable({ positions }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 opacity-50">
        <BarChart3 size={20} className="text-slate-600 mb-1.5" />
        <p className="text-slate-600 text-xs">No open positions</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
            <th className="text-left py-2.5 px-3 font-medium">Market</th>
            <th className="text-left py-2.5 px-3 font-medium">Side</th>
            <th className="text-right py-2.5 px-3 font-medium">Qty</th>
            <th className="text-right py-2.5 px-3 font-medium">Exposure</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
              <td className="py-2.5 px-3 text-slate-300 font-mono truncate max-w-[280px]">
                {p.ticker || p.market_ticker || '—'}
              </td>
              <td className="py-2.5 px-3">
                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  (p.side || 'yes').toLowerCase() === 'yes'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {(p.side || 'yes').toUpperCase()}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-slate-200 font-mono">{p.total_traded ?? p.quantity ?? 0}</td>
              <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">
                ${((p.market_exposure || 0) / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Recent Trades ───────────────────────────────────────────
function RecentTrades() {
  const [fills, setFills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('GET', '/trades')
      .then(d => setFills(d.fills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-600" size={18} /></div>;

  if (fills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 opacity-50">
        <DollarSign size={20} className="text-slate-600 mb-1.5" />
        <p className="text-slate-600 text-xs">No trades yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
            <th className="text-left py-2.5 px-3 font-medium">Time</th>
            <th className="text-left py-2.5 px-3 font-medium">Action</th>
            <th className="text-left py-2.5 px-3 font-medium">Ticker</th>
            <th className="text-right py-2.5 px-3 font-medium">Qty × Price</th>
          </tr>
        </thead>
        <tbody>
          {fills.slice(0, 10).map((f, i) => (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
              <td className="py-2 px-3 text-slate-500 whitespace-nowrap font-mono">
                {f.created_time ? new Date(f.created_time).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </td>
              <td className="py-2 px-3">
                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  f.action === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {(f.action || 'buy').toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-3 text-slate-300 font-mono truncate max-w-[220px]">{f.ticker || '—'}</td>
              <td className="py-2 px-3 text-right text-slate-200 font-mono">
                {f.count ?? f.yes_count ?? f.no_count ?? '—'}× {f.yes_price ?? f.no_price ?? '—'}¢
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Audit Log ───────────────────────────────────────────────
function AuditLog({ refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/audit');
      setEvents(data.entries || []);
    } catch (e) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents, refreshKey]);

  const getEventColor = (eventType) => {
    const t = (eventType || '').toLowerCase();
    if (t.includes('complete') || t.includes('executed') || t.includes('success')) return 'bg-emerald-500/15 text-emerald-400';
    if (t.includes('denied') || t.includes('blocked') || t.includes('error') || t.includes('kill')) return 'bg-red-500/15 text-red-400';
    if (t.includes('approved') || t.includes('allowed')) return 'bg-sky-500/15 text-sky-400';
    if (t.includes('warn') || t.includes('rule')) return 'bg-amber-500/15 text-amber-400';
    return 'bg-slate-700/30 text-slate-400';
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-600" size={18} /></div>;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 opacity-50">
        <Activity size={20} className="text-slate-600 mb-1.5" />
        <p className="text-slate-600 text-xs">No audit entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
      {events.slice(0, 20).map((event, i) => (
        <div key={event.event_id || i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800/30 transition-colors group">
          <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap w-16 shrink-0">
            {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${getEventColor(event.event)}`}>
            {(event.event || event.event_type || '').replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] text-slate-500 truncate">
            {event.details
              ? (typeof event.details === 'string' ? event.details : JSON.stringify(event.details).slice(0, 80))
              : event.action_type || ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Kill Switch ─────────────────────────────────────────────
function KillSwitch({ isActive, onToggle }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleToggle = async () => {
    const activate = !isActive;
    if (activate && !window.confirm('⚠️ ACTIVATE KILL SWITCH?\n\nThis will block all new trading activity.')) return;
    setLoading(true);
    try {
      await apiRequest('POST', `/kill-switch?activate=${activate}&reason=${encodeURIComponent(reason || 'dashboard')}`);
      if (onToggle) onToggle();
    } catch (e) { alert(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  return (
    <div className={`rounded-lg border transition-all ${
      isActive ? 'bg-red-500/8 border-red-500/30' : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-600/60'
    }`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <div>
            <p className="text-sm font-medium text-slate-200">Kill Switch</p>
            <p className="text-[10px] text-slate-500">Emergency stop for all agents</p>
          </div>
        </div>
        <Shield size={18} className={isActive ? 'text-red-400' : 'text-slate-600'} />
      </div>

      <div className="px-4 pb-4">
        {!isActive && (
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/40 border border-slate-700/60 rounded-md text-sm text-white placeholder-slate-600 mb-3 focus:outline-none focus:border-red-500/40 transition-colors"
          />
        )}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
              : 'bg-red-500/15 hover:bg-red-500/25 text-red-400'
          }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> :
            isActive ? <><CheckCircle size={14} /> Reset Kill Switch</> : <><AlertCircle size={14} /> Activate Kill Switch</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Run Trade Cycle ─────────────────────────────────────────
function RunTradeCycle({ onComplete, killActive }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await apiRequest('POST', '/run');
      setResult(r);
      if (onComplete) onComplete();
    } catch (e) { setResult({ error: e.message }); }
    finally { setRunning(false); }
  };

  return (
    <div className="rounded-lg bg-slate-800/30 border border-slate-700/40 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-md bg-emerald-500/15 flex items-center justify-center">
          <Play size={14} className="text-emerald-400 ml-0.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">Trade Cycle</p>
          <p className="text-[10px] text-slate-500">Signal → Match → Govern → Execute</p>
        </div>
      </div>
      <button
        onClick={handleRun}
        disabled={running || killActive}
        className={`w-full py-2.5 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
          running || killActive
            ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
        }`}
      >
        {running ? <><Loader2 size={14} className="animate-spin" /> Running…</> :
          killActive ? <><XCircle size={14} /> Kill Switch Active</> : <><Play size={14} /> Run Trade Cycle</>
        }
      </button>
      {result && (
        <div className={`mt-3 px-3 py-2.5 rounded-md text-xs font-mono ${
          result.error ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {result.error ? `Error: ${result.error}` : (
            <>
              ✓ {result.results?.total ?? 0} signals → {result.results?.matched ?? 0} matched → {result.results?.approved ?? 0} approved → {result.results?.executed ?? 0} executed
              {(result.results?.trades || []).map((t, i) => (
                <div key={i} className="mt-1 text-sky-400">💸 {t.side?.toUpperCase()} {t.count}× {t.ticker} @ {t.price}¢</div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function KalshiTradingDashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/dashboard');
      setDashData(data);
    } catch (e) {
      setDashData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-600" size={24} />
      </div>
    );
  }

  if (!dashData) {
    return (
      <div className="text-center py-24">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={20} className="text-amber-400" />
        </div>
        <p className="text-sm text-slate-300 mb-1">API Not Connected</p>
        <p className="text-xs text-slate-500 mb-4">Could not reach the trading service</p>
        <button onClick={handleRefresh} className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-400 hover:border-slate-600 transition-colors inline-flex items-center gap-1.5">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  const bal = dashData.balance?.usd ?? 0;
  const gov = dashData.governance ?? {};
  const positions = dashData.positions?.market_positions ?? [];
  const killActive = gov.kill_switch_active || false;
  const dailySpendCents = gov.daily_spend_cents ?? 0;
  const dailyLimitCents = gov.config?.max_daily_spend_cents ?? 1000;
  const drawdownPct = gov.current_drawdown_pct ?? 0;

  return (
    <div className="space-y-5">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            dashData.dry_run
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dashData.dry_run ? 'bg-amber-400' : 'bg-red-400 animate-pulse'}`} />
            {dashData.dry_run ? 'Dry Run' : 'Live Trading'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        </div>
        <button onClick={handleRefresh} className="p-1.5 hover:bg-slate-800 rounded-md transition-colors" title="Refresh">
          <RefreshCw size={14} className="text-slate-500" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Balance" value={`$${bal.toFixed(2)}`} accent="emerald" />
        <MetricPill
          label="Daily Spend"
          value={`$${(dailySpendCents / 100).toFixed(2)}`}
          sub={`of $${(dailyLimitCents / 100).toFixed(2)} limit`}
          accent={dailySpendCents > dailyLimitCents * 0.8 ? 'amber' : 'sky'}
        />
        <MetricPill
          label="Drawdown"
          value={`${(drawdownPct * 100).toFixed(1)}%`}
          sub={`${((gov.config?.drawdown_kill_switch_pct ?? 0.2) * 100).toFixed(0)}% kill threshold`}
          accent={drawdownPct > 0.15 ? 'red' : 'sky'}
        />
        <MetricPill
          label="Positions"
          value={positions.length}
          accent="sky"
        />
      </div>

      {/* Positions */}
      <div className="rounded-lg bg-slate-800/20 border border-slate-700/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Positions</p>
          <span className="text-[10px] text-slate-600">{positions.length} open</span>
        </div>
        <PositionsTable positions={positions} />
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RunTradeCycle onComplete={handleRefresh} killActive={killActive} />
        <KillSwitch isActive={killActive} onToggle={handleRefresh} />
      </div>

      {/* Audit + Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-800/20 border border-slate-700/40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Audit Log</p>
            <button onClick={handleRefresh} className="p-1 hover:bg-slate-700/30 rounded transition-colors">
              <RefreshCw size={12} className="text-slate-600" />
            </button>
          </div>
          <div className="p-2">
            <AuditLog refreshKey={refreshKey} />
          </div>
        </div>

        <div className="rounded-lg bg-slate-800/20 border border-slate-700/40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Trades</p>
          </div>
          <RecentTrades />
        </div>
      </div>
    </div>
  );
}