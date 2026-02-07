/**
 * Kalshi Trading Dashboard Component
 * Wired to live-trader Cloud Run API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertCircle, CheckCircle, XCircle, Shield, 
  Zap, Clock, RefreshCw, Loader2, TrendingUp, Play, BarChart3, DollarSign
} from 'lucide-react';

const API_BASE = 'https://live-trader-164814074525.us-central1.run.app';

// ─────────────────────────────────────────────────────────────────
// API Helper
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// Status Card Component
// ─────────────────────────────────────────────────────────────────

const StatusCard = ({ icon: Icon, label, value, sub, status }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        status === 'success' ? 'bg-emerald-500/20' : 
        status === 'warning' ? 'bg-amber-500/20' : 
        status === 'danger' ? 'bg-red-500/20' : 'bg-indigo-500/20'
      }`}>
        <Icon size={20} className={
          status === 'success' ? 'text-emerald-400' : 
          status === 'warning' ? 'text-amber-400' : 
          status === 'danger' ? 'text-red-400' : 'text-indigo-400'
        } />
      </div>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white font-mono">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Positions Table
// ─────────────────────────────────────────────────────────────────

function PositionsTable({ positions }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No active positions</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase">
            <th className="text-left py-3 px-2">Market</th>
            <th className="text-left py-3 px-2">Side</th>
            <th className="text-left py-3 px-2">Qty</th>
            <th className="text-left py-3 px-2">Exposure</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {positions.map((p, i) => (
            <tr key={i} className="hover:bg-slate-800/30">
              <td className="py-2.5 px-2 text-slate-300 font-mono text-xs max-w-[250px] truncate">
                {p.ticker || p.market_ticker || '—'}
              </td>
              <td className="py-2.5 px-2">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {(p.side || 'yes').toUpperCase()}
                </span>
              </td>
              <td className="py-2.5 px-2 text-white font-mono">{p.total_traded ?? p.quantity ?? '—'}</td>
              <td className="py-2.5 px-2 text-emerald-400 font-mono">
                {p.market_exposure !== undefined ? `$${(p.market_exposure / 100).toFixed(2)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Recent Trades Table
// ─────────────────────────────────────────────────────────────────

function RecentTrades() {
  const [fills, setFills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('GET', '/trades')
      .then(d => setFills(d.fills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
      </div>
    );
  }

  if (fills.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No trades yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase">
            <th className="text-left py-3 px-2">Time</th>
            <th className="text-left py-3 px-2">Action</th>
            <th className="text-left py-3 px-2">Ticker</th>
            <th className="text-left py-3 px-2">Qty × Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {fills.slice(0, 15).map((f, i) => (
            <tr key={i} className="hover:bg-slate-800/30">
              <td className="py-2 px-2 text-slate-500 whitespace-nowrap text-xs font-mono">
                {f.created_time ? new Date(f.created_time).toLocaleString() : '—'}
              </td>
              <td className="py-2 px-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                  f.action === 'buy' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {(f.action || 'buy').toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-2 text-slate-300 font-mono text-xs">
                {f.ticker || '—'}
              </td>
              <td className="py-2 px-2 text-white font-mono text-xs">
                {f.count ?? f.yes_count ?? f.no_count ?? '—'}x @ {f.yes_price ?? f.no_price ?? '—'}¢
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Audit Log Component
// ─────────────────────────────────────────────────────────────────

function AuditLog({ refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/audit');
      setEvents(data.entries || []);
    } catch (e) {
      console.error('Failed to fetch audit log:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents, refreshKey]);

  const getEventStyle = (eventType) => {
    const type = (eventType || '').toLowerCase();
    if (type.includes('complete') || type.includes('executed') || type.includes('success')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (type.includes('denied') || type.includes('blocked') || type.includes('error') || type.includes('kill')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (type.includes('approved') || type.includes('allowed')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (type.includes('warn') || type.includes('rule')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No audit entries yet</p>
        <p className="text-slate-600 text-xs mt-1">Entries appear when trade cycles run</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase">
            <th className="text-left py-3 px-2">Time</th>
            <th className="text-left py-3 px-2">Event</th>
            <th className="text-left py-3 px-2">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {events.slice(0, 20).map((event, i) => (
            <tr key={event.event_id || i} className="hover:bg-slate-800/30">
              <td className="py-2 px-2 text-slate-500 whitespace-nowrap text-xs font-mono">
                {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '—'}
              </td>
              <td className="py-2 px-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getEventStyle(event.event)}`}>
                  {(event.event || event.event_type || '').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-2 px-2 text-slate-400 text-xs max-w-[300px] truncate">
                {event.details 
                  ? (typeof event.details === 'string' ? event.details : JSON.stringify(event.details).slice(0, 100))
                  : event.action_type || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Kill Switch Component
// ─────────────────────────────────────────────────────────────────

function KillSwitch({ isActive, onToggle }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleToggle = async () => {
    const activate = !isActive;
    if (activate && !window.confirm('⚠️ ACTIVATE KILL SWITCH?\n\nThis will block all new trading activity.')) {
      return;
    }

    setLoading(true);
    try {
      await apiRequest('POST', `/kill-switch?activate=${activate}&reason=${encodeURIComponent(reason || 'dashboard')}`);
      if (onToggle) onToggle();
    } catch (e) {
      alert(`Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl p-5 border-2 transition-all ${
      isActive 
        ? 'bg-red-500/10 border-red-500/50' 
        : 'bg-slate-800/50 border-slate-700/50 hover:border-red-500/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <div>
            <h4 className="font-semibold text-white">Global Kill Switch</h4>
            <p className="text-xs text-slate-500">Emergency stop for all agents</p>
          </div>
        </div>
        <Shield size={24} className={isActive ? 'text-red-400' : 'text-slate-600'} />
      </div>

      {!isActive && (
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm mb-3 focus:outline-none focus:border-red-500/50"
        />
      )}

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
          isActive
            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400'
            : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
        }`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isActive ? (
          <>
            <CheckCircle size={18} />
            RESET KILL SWITCH
          </>
        ) : (
          <>
            <AlertCircle size={18} />
            ACTIVATE KILL SWITCH
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Run Trade Cycle Button
// ─────────────────────────────────────────────────────────────────

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
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Play size={20} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Trade Cycle</h4>
            <p className="text-xs text-slate-500">Run the full signal → match → govern → execute pipeline</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={running || killActive}
        className={`w-full py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
          running || killActive
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400'
        }`}
      >
        {running ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Running Pipeline...
          </>
        ) : killActive ? (
          <>
            <XCircle size={18} />
            Kill Switch Active
          </>
        ) : (
          <>
            <Play size={18} />
            RUN TRADE CYCLE
          </>
        )}
      </button>

      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-mono ${
          result.error 
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        }`}>
          {result.error ? (
            `Error: ${result.error}`
          ) : (
            <>
              <strong>✅ Complete</strong> — {result.results?.total ?? 0} signals → {result.results?.matched ?? 0} matched → {result.results?.approved ?? 0} approved → {result.results?.executed ?? 0} executed
              {(result.results?.trades || []).map((t, i) => (
                <div key={i} className="mt-1">💸 {t.side?.toUpperCase()} {t.count}x {t.ticker} @ {t.price}¢</div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────

export default function KalshiTradingDashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/dashboard');
      setDashData(data);
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
      setDashData(null);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (!dashData) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Live Trader API Not Connected</h3>
        <p className="text-slate-400 mb-4">Could not reach the Cloud Run trading service</p>
        <code className="block bg-slate-800 px-4 py-3 rounded-lg text-sm text-slate-300 max-w-lg mx-auto text-left font-mono">
          {API_BASE}
        </code>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Retry Connection
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
    <div className="space-y-6">
      {/* Mode Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            dashData.dry_run 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${dashData.dry_run ? 'bg-amber-400' : 'bg-red-400 animate-pulse'}`} />
            {dashData.dry_run ? '🧪 DRY RUN' : '🔴 LIVE TRADING'}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          icon={Activity}
          label="Connection"
          value="● Connected"
          status="success"
        />
        <StatusCard
          icon={TrendingUp}
          label="Kalshi Balance"
          value={`$${bal.toFixed(2)}`}
          status="success"
        />
        <StatusCard
          icon={Zap}
          label="Daily Spend"
          value={`$${(dailySpendCents / 100).toFixed(2)}`}
          sub={`of $${(dailyLimitCents / 100).toFixed(2)} limit`}
          status={dailySpendCents > dailyLimitCents * 0.8 ? 'warning' : undefined}
        />
        <StatusCard
          icon={Shield}
          label="Drawdown"
          value={`${(drawdownPct * 100).toFixed(1)}%`}
          sub={`${((gov.config?.drawdown_kill_switch_pct ?? 0.2) * 100).toFixed(0)}% kill threshold`}
          status={drawdownPct > 0.15 ? 'danger' : undefined}
        />
      </div>

      {/* Positions */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-400" />
            Active Positions ({positions.length})
          </h3>
        </div>
        <PositionsTable positions={positions} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Run Trade Cycle */}
          <RunTradeCycle onComplete={handleRefresh} killActive={killActive} />

          {/* Kill Switch */}
          <KillSwitch isActive={killActive} onToggle={handleRefresh} />
        </div>

        {/* Right Column - Audit Log */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Audit Log
            </h3>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition"
            >
              <RefreshCw size={16} className="text-slate-400" />
            </button>
          </div>
          <AuditLog refreshKey={refreshKey} />
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" />
            Recent Trades
          </h3>
        </div>
        <RecentTrades />
      </div>
    </div>
  );
}