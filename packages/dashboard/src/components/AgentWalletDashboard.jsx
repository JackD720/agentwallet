/**
 * Kalshi Trading Dashboard Component
 * Matches AgentWallet dashboard dark theme
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertCircle, CheckCircle, XCircle, Shield, 
  Zap, Clock, RefreshCw, Loader2, TrendingUp
} from 'lucide-react';

const API_BASE = 'http://localhost:8100';

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

const StatusCard = ({ icon: Icon, label, value, status }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        status === 'success' ? 'bg-emerald-500/20' : 
        status === 'warning' ? 'bg-amber-500/20' : 'bg-indigo-500/20'
      }`}>
        <Icon size={20} className={
          status === 'success' ? 'text-emerald-400' : 
          status === 'warning' ? 'text-amber-400' : 'text-indigo-400'
        } />
      </div>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Pending Approvals Component
// ─────────────────────────────────────────────────────────────────

function PendingApprovals({ onUpdate }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/approvals/pending');
      setApprovals(data.pending || []);
    } catch (e) {
      console.error('Failed to fetch approvals:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleApproval = async (requestId, approved) => {
    setProcessing(requestId);
    try {
      await apiRequest('POST', `/approvals/${requestId}`, {
        request_id: requestId,
        approved,
        approver: 'dashboard-user',
      });
      await fetchApprovals();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(`Failed to ${approved ? 'approve' : 'deny'}: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-slate-400">No pending approvals</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval) => (
        <div
          key={approval.request_id}
          className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="inline-block px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                PENDING
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(approval.created_at).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-slate-400 font-mono">
              {approval.agent_id?.slice(0, 8)}...
            </p>
          </div>

          <div className="bg-slate-800/50 rounded p-3 mb-3 text-sm space-y-1">
            <p><span className="text-slate-500">Ticker:</span> <span className="text-white font-mono">{approval.order?.ticker?.slice(-12)}</span></p>
            <p><span className="text-slate-500">Side:</span> <span className="text-white">{approval.order?.side?.toUpperCase()}</span></p>
            <p><span className="text-slate-500">Count:</span> <span className="text-white">{approval.order?.count}</span></p>
            <p><span className="text-slate-500">Price:</span> <span className="text-emerald-400">{approval.order?.yes_price || approval.order?.no_price}¢</span></p>
            <p className="text-amber-400 text-xs mt-2">{approval.reason}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleApproval(approval.request_id, true)}
              disabled={processing === approval.request_id}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {processing === approval.request_id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Approve
            </button>
            <button
              onClick={() => handleApproval(approval.request_id, false)}
              disabled={processing === approval.request_id}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {processing === approval.request_id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Audit Log Component
// ─────────────────────────────────────────────────────────────────

function AuditLog({ limit = 20 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiRequest('GET', `/audit?limit=${limit}`);
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to fetch audit log:', e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const getEventStyle = (eventType) => {
    const type = eventType || '';
    if (type.includes('executed')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (type.includes('denied')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (type.includes('allowed')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (type.includes('kill')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (type.includes('rule')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
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
            <th className="text-left py-3 px-2">Action</th>
            <th className="text-left py-3 px-2">Agent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {events.slice(0, 15).map((event, i) => (
            <tr key={event.event_id || i} className="hover:bg-slate-800/30">
              <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                {new Date(event.timestamp).toLocaleTimeString()}
              </td>
              <td className="py-2 px-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getEventStyle(event.event_type)}`}>
                  {(event.event_type || '').replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-2 px-2 text-slate-300">
                {event.action_type || '-'}
              </td>
              <td className="py-2 px-2 text-slate-500 font-mono text-xs">
                {(event.agent_id || '').slice(0, 8)}...
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

function KillSwitch() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleActivate = async () => {
    if (!window.confirm('⚠️ ACTIVATE KILL SWITCH?\n\nThis will cancel all open orders and block new trading activity.')) {
      return;
    }

    setLoading(true);
    try {
      await apiRequest('POST', '/kill-switch', { reason });
      setIsActive(true);
    } catch (e) {
      alert(`Failed to activate: ${e.message}`);
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
        onClick={handleActivate}
        disabled={loading || isActive}
        className={`w-full py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
          isActive
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
        }`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isActive ? (
          <>
            <XCircle size={18} />
            KILL SWITCH ACTIVE
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
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────

export default function KalshiTradingDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiRequest('GET', '/status');
        setStatus(data);
      } catch (e) {
        console.error('Failed to fetch status:', e);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (!status || status.status !== 'connected') {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Kalshi API Not Connected</h3>
        <p className="text-slate-400 mb-4">Start the API server to enable trading</p>
        <code className="block bg-slate-800 px-4 py-3 rounded-lg text-sm text-slate-300 max-w-lg mx-auto text-left">
          cd packages/sdk/src/services<br/>
          uvicorn agent_wallet_api:app --port 8100
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

  return (
    <div className="space-y-6">
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
          value={`$${((status.kalshi_balance_cents || 0) / 100).toFixed(2)}`}
          status="success"
        />
        <StatusCard
          icon={Zap}
          label="Active Agents"
          value={status.agents_count || 0}
        />
        <StatusCard
          icon={Shield}
          label="Active Rules"
          value={status.rules_count || 0}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                Pending Approvals
              </h3>
            </div>
            <PendingApprovals onUpdate={handleRefresh} />
          </div>

          {/* Kill Switch */}
          <KillSwitch />
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
          <AuditLog key={refreshKey} />
        </div>
      </div>
    </div>
  );
}