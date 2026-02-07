import { useState, useEffect, useRef } from "react";

// ─── Demo Data: mirrors governance_bridge.py output ───
const DEMO_SIGNALS = [
  {
    id: "sig_001",
    market: "Bitcoin above $100k on Feb 28?",
    ticker: "KXBTC-26FEB-B100K",
    direction: "YES",
    price: 0.58,
    arsScore: 0.72,
    entryQuality: "good",
    conviction: 0.35,
    numTraders: 7,
    totalSize: 45000,
    recommendedSize: 0.04,
    contracts: 34,
    costCents: 1938,
    category: "Crypto",
    traders: ["whale_01", "shark_02", "prof_03", "quant_04", "macro_05"],
  },
  {
    id: "sig_002",
    market: "Fed rate cut in March 2026?",
    ticker: "KXFED-26MAR-RATECUT",
    direction: "NO",
    price: 0.73,
    arsScore: 0.55,
    entryQuality: "fair",
    conviction: 0.20,
    numTraders: 4,
    totalSize: 28000,
    recommendedSize: 0.03,
    contracts: 19,
    costCents: 1387,
    category: "Economics",
    traders: ["macro_king", "fed_watcher", "bond_guru"],
  },
  {
    id: "sig_003",
    market: "GPT-5 released before March?",
    ticker: "KXAI-26FEB-GPT5",
    direction: "YES",
    price: 0.82,
    arsScore: 0.18,
    entryQuality: "very_late",
    conviction: 0.10,
    numTraders: 2,
    totalSize: 12000,
    recommendedSize: 0.01,
    contracts: 5,
    costCents: 410,
    category: "Tech",
    traders: ["tech_bet_01"],
  },
  {
    id: "sig_004",
    market: "US recession declared Q1 2026?",
    ticker: "KXECON-26Q1-RECESS",
    direction: "NO",
    price: 0.91,
    arsScore: 0.81,
    entryQuality: "good",
    conviction: 0.45,
    numTraders: 9,
    totalSize: 67000,
    recommendedSize: 0.06,
    contracts: 30,
    costCents: 2730,
    category: "Economics",
    traders: ["econ_prof", "hedge_01", "macro_king", "quant_04"],
  },
  {
    id: "sig_005",
    market: "Super Bowl LX over 49.5?",
    ticker: "KXSPORT-SB-TOTAL",
    direction: "YES",
    price: 0.51,
    arsScore: 0.22,
    entryQuality: "good",
    conviction: 0.08,
    numTraders: 2,
    totalSize: 5000,
    recommendedSize: 0.02,
    contracts: 18,
    costCents: 918,
    category: "Sports",
    traders: ["sports_degen"],
  },
];

const GOVERNANCE_CONFIG = {
  maxPerTrade: 2000,
  maxDaily: 5000,
  maxWeekly: 15000,
  minArsScore: 0.3,
  minConviction: 0.05,
  allowedQualities: ["good", "fair"],
  drawdownThreshold: 0.20,
  consecutiveLossLimit: 5,
};

// ─── Rule evaluation engine (mirrors Python) ───
function evaluateSignal(signal, walletState, config) {
  const rules = [];
  const cost = signal.costCents;

  rules.push({
    id: "kill_switch", name: "Kill Switch", type: "KILL_SWITCH",
    passed: !walletState.killSwitch,
    reason: walletState.killSwitch ? "Kill switch active — all trading halted" : "Kill switch inactive",
  });
  rules.push({
    id: "drawdown", name: "Drawdown Monitor", type: "KILL_SWITCH",
    passed: walletState.drawdown < config.drawdownThreshold,
    reason: `Drawdown ${(walletState.drawdown * 100).toFixed(1)}% ${walletState.drawdown < config.drawdownThreshold ? '<' : '≥'} ${(config.drawdownThreshold * 100)}% threshold`,
  });
  rules.push({
    id: "consecutive", name: "Consecutive Losses", type: "KILL_SWITCH",
    passed: walletState.consecutiveLosses < config.consecutiveLossLimit,
    reason: `${walletState.consecutiveLosses} losses ${walletState.consecutiveLosses < config.consecutiveLossLimit ? '<' : '≥'} limit of ${config.consecutiveLossLimit}`,
  });
  rules.push({
    id: "entry_quality", name: "Entry Quality", type: "SIGNAL_FILTER",
    passed: config.allowedQualities.includes(signal.entryQuality),
    reason: `"${signal.entryQuality}" ${config.allowedQualities.includes(signal.entryQuality) ? '✓' : '✗'} allowed: [${config.allowedQualities.join(', ')}]`,
  });
  rules.push({
    id: "ars_score", name: "ARS Score", type: "SIGNAL_FILTER",
    passed: signal.arsScore >= config.minArsScore,
    reason: `${signal.arsScore.toFixed(2)} ${signal.arsScore >= config.minArsScore ? '≥' : '<'} minimum ${config.minArsScore}`,
  });
  rules.push({
    id: "conviction", name: "Trader Consensus", type: "SIGNAL_FILTER",
    passed: signal.conviction >= config.minConviction,
    reason: `${(signal.conviction * 100).toFixed(0)}% ${signal.conviction >= config.minConviction ? '≥' : '<'} minimum ${(config.minConviction * 100)}%`,
  });
  const perTradeOk = cost <= config.maxPerTrade;
  rules.push({
    id: "per_trade", name: "Per-Trade Limit", type: "SPEND_LIMIT",
    passed: perTradeOk,
    reason: `$${(cost / 100).toFixed(2)} ${perTradeOk ? '≤' : '>'} $${(config.maxPerTrade / 100).toFixed(0)} limit`,
  });
  const dailyProjected = walletState.dailySpend + cost;
  const dailyOk = dailyProjected <= config.maxDaily;
  rules.push({
    id: "daily_limit", name: "Daily Limit", type: "SPEND_LIMIT",
    passed: dailyOk,
    reason: `$${(dailyProjected / 100).toFixed(2)} ${dailyOk ? '≤' : '>'} $${(config.maxDaily / 100).toFixed(0)}/day (used: $${(walletState.dailySpend / 100).toFixed(2)})`,
  });
  const balanceOk = cost <= walletState.balance * 100;
  rules.push({
    id: "balance", name: "Balance Check", type: "BALANCE",
    passed: balanceOk,
    reason: `$${walletState.balance.toFixed(2)} ${balanceOk ? '≥' : '<'} $${(cost / 100).toFixed(2)} cost`,
  });

  const failed = rules.filter(r => !r.passed);
  const killSwitched = failed.some(r => r.type === "KILL_SWITCH");
  const decision = killSwitched ? "kill_switched" : failed.length > 0 ? "blocked" : "approved";

  return { rules, decision, failed, cost };
}

// ─── Styling ───
const colors = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceAlt: "#181824",
  border: "#1e1e2e",
  borderHover: "#2a2a3e",
  text: "#e2e2e8",
  textDim: "#6b6b80",
  textMuted: "#44445a",
  accent: "#00e5a0",
  accentDim: "#00e5a020",
  danger: "#ff4466",
  dangerDim: "#ff446620",
  warn: "#ffaa00",
  warnDim: "#ffaa0020",
  blue: "#4488ff",
  blueDim: "#4488ff20",
  purple: "#8855ff",
};

// ─── Components ───
function Badge({ children, color = "accent", size = "sm" }) {
  const c = colors[color] || color;
  const dim = colors[color + "Dim"] || c + "20";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "2px 8px" : "4px 12px",
      borderRadius: 4,
      background: dim,
      color: c,
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      border: `1px solid ${c}30`,
    }}>{children}</span>
  );
}

function StatCard({ label, value, sub, color = colors.accent }) {
  return (
    <div style={{
      padding: "16px 20px",
      background: colors.surface,
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: colors.textDim, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function RuleRow({ rule, animate, delay }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    } else {
      setShow(true);
    }
  }, [animate, delay]);

  if (!show) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px",
      background: rule.passed ? "transparent" : colors.dangerDim,
      borderRadius: 6,
      borderLeft: `3px solid ${rule.passed ? colors.accent : colors.danger}`,
      opacity: show ? 1 : 0,
      transform: show ? "translateX(0)" : "translateX(-10px)",
      transition: "all 0.3s ease",
      fontSize: 12,
    }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
        {rule.passed ? "✅" : "❌"}
      </span>
      <span style={{ fontWeight: 600, color: colors.text, minWidth: 130, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
        {rule.name}
      </span>
      <span style={{ color: rule.passed ? colors.textDim : colors.danger, flex: 1, fontSize: 11 }}>
        {rule.reason}
      </span>
      <Badge color={
        rule.type === "KILL_SWITCH" ? "danger" :
        rule.type === "SIGNAL_FILTER" ? "purple" :
        rule.type === "SPEND_LIMIT" ? "warn" : "blue"
      } size="sm">
        {rule.type.replace("_", " ")}
      </Badge>
    </div>
  );
}

function SignalCard({ signal, evaluation, isActive, onClick, index, isProcessing }) {
  const decisionColors = {
    approved: colors.accent,
    blocked: colors.danger,
    kill_switched: colors.danger,
    pending: colors.textDim,
  };
  const decision = evaluation?.decision || "pending";
  const dc = decisionColors[decision];

  return (
    <div onClick={onClick} style={{
      padding: "14px 16px",
      background: isActive ? colors.surfaceAlt : colors.surface,
      borderRadius: 8,
      border: `1px solid ${isActive ? dc + "60" : colors.border}`,
      cursor: "pointer",
      transition: "all 0.2s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {isProcessing && (
        <div style={{
          position: "absolute", top: 0, left: 0, height: 2, background: colors.accent,
          animation: "scanline 1.5s ease-in-out infinite",
          width: "100%",
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4, lineHeight: 1.3 }}>
            {signal.market}
          </div>
          <div style={{ fontSize: 11, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
            {signal.ticker}
          </div>
        </div>
        <Badge color={signal.direction === "YES" ? "accent" : "danger"} size="sm">
          {signal.direction}
        </Badge>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MiniStat label="ARS" value={signal.arsScore.toFixed(2)} good={signal.arsScore >= 0.3} />
        <MiniStat label="Entry" value={signal.entryQuality} good={["good", "fair"].includes(signal.entryQuality)} />
        <MiniStat label="Price" value={`${(signal.price * 100).toFixed(0)}¢`} />
        <MiniStat label="Traders" value={signal.numTraders} />
      </div>
      {evaluation && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 4,
          background: dc + "15",
          border: `1px solid ${dc}30`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 12 }}>
            {decision === "approved" ? "✅" : decision === "blocked" ? "🚫" : "🛑"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: dc, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            {decision}
          </span>
          {evaluation.failed.length > 0 && (
            <span style={{ fontSize: 10, color: colors.textDim, marginLeft: "auto" }}>
              {evaluation.failed.length} rule{evaluation.failed.length > 1 ? 's' : ''} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, good }) {
  return (
    <div style={{ fontSize: 10 }}>
      <span style={{ color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label} </span>
      <span style={{
        color: good === undefined ? colors.textDim : good ? colors.accent : colors.danger,
        fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
      }}>{value}</span>
    </div>
  );
}

function AuditEntry({ entry, index }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const icon = entry.decision === "approved" ? "✅" : entry.decision === "blocked" ? "🚫" : "🛑";
  const dc = entry.decision === "approved" ? colors.accent : colors.danger;

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "8px 0",
      borderBottom: `1px solid ${colors.border}`,
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(5px)",
      transition: "all 0.3s ease",
    }}>
      <span style={{ fontSize: 13, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>
          <span style={{ color: dc, fontWeight: 700 }}>{entry.decision.toUpperCase()}</span>
          {" — "}{entry.direction} on {entry.market}
        </div>
        {entry.blockedBy?.length > 0 && (
          <div style={{ fontSize: 10, color: colors.danger, marginTop: 2 }}>
            Blocked by: {entry.blockedBy.join(", ")}
          </div>
        )}
        <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
          {entry.timestamp} · {entry.latencyMs}ms · eval:{entry.evalId.slice(0, 8)}
        </div>
      </div>
      {entry.cost && (
        <span style={{ fontSize: 11, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          ${(entry.cost / 100).toFixed(2)}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ value, max, color = colors.accent, height = 6 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height, background: colors.border, borderRadius: height / 2, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: pct > 80 ? colors.danger : pct > 60 ? colors.warn : color,
        borderRadius: height / 2,
        transition: "width 0.5s ease, background 0.3s ease",
      }} />
    </div>
  );
}

function DrawdownGauge({ value, threshold }) {
  const pct = Math.min(value / threshold, 1);
  const angle = pct * 180;
  const color = pct > 0.8 ? colors.danger : pct > 0.5 ? colors.warn : colors.accent;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="80" height="48" viewBox="0 0 80 48">
        <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none" stroke={colors.border} strokeWidth="6" strokeLinecap="round" />
        <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${angle * 0.56} 200`}
          style={{ transition: "all 0.5s ease" }}
        />
        <text x="40" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
          {(value * 100).toFixed(1)}%
        </text>
      </svg>
      <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Drawdown ({(threshold * 100)}% kill)
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
export default function AgentWalletGovernanceDashboard() {
  const [activeSignal, setActiveSignal] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [walletState, setWalletState] = useState({
    balance: 500, dailySpend: 0, weeklySpend: 0, drawdown: 0,
    consecutiveLosses: 0, peakBalance: 500, killSwitch: false,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const auditRef = useRef(null);

  const processSignal = (signal, state) => {
    const ev = evaluateSignal(signal, state, GOVERNANCE_CONFIG);
    const newState = { ...state };

    if (ev.decision === "approved") {
      newState.balance -= ev.cost / 100;
      newState.dailySpend += ev.cost;
      newState.weeklySpend += ev.cost;
      if (newState.balance < newState.peakBalance) {
        newState.drawdown = (newState.peakBalance - newState.balance) / newState.peakBalance;
      }
    }

    const entry = {
      evalId: crypto.randomUUID(),
      timestamp: new Date().toISOString().slice(11, 19),
      market: signal.market,
      direction: signal.direction,
      decision: ev.decision,
      blockedBy: ev.failed.map(r => r.name),
      cost: ev.decision === "approved" ? ev.cost : null,
      latencyMs: (Math.random() * 3 + 0.5).toFixed(1),
    };

    return { evaluation: ev, newState, entry };
  };

  const runAllSignals = async () => {
    setIsRunning(true);
    setEvaluations({});
    setAuditLog([]);
    setProcessedCount(0);
    setWalletState({
      balance: 500, dailySpend: 0, weeklySpend: 0, drawdown: 0,
      consecutiveLosses: 0, peakBalance: 500, killSwitch: false,
    });

    let state = {
      balance: 500, dailySpend: 0, weeklySpend: 0, drawdown: 0,
      consecutiveLosses: 0, peakBalance: 500, killSwitch: false,
    };

    for (let i = 0; i < DEMO_SIGNALS.length; i++) {
      const signal = DEMO_SIGNALS[i];
      setCurrentProcessing(signal.id);
      setActiveSignal(signal.id);
      await new Promise(r => setTimeout(r, 800));

      const { evaluation, newState, entry } = processSignal(signal, state);
      state = newState;

      setEvaluations(prev => ({ ...prev, [signal.id]: evaluation }));
      setWalletState({ ...state });
      setAuditLog(prev => [entry, ...prev]);
      setProcessedCount(i + 1);

      await new Promise(r => setTimeout(r, 1200));
      setCurrentProcessing(null);
    }
    setIsRunning(false);
  };

  const activeEval = activeSignal ? evaluations[activeSignal] : null;
  const activeSignalData = DEMO_SIGNALS.find(s => s.id === activeSignal);
  const totalBlocked = Object.values(evaluations).filter(e => e.decision !== "approved").length;
  const totalApproved = Object.values(evaluations).filter(e => e.decision === "approved").length;

  return (
    <div style={{
      background: colors.bg,
      minHeight: "100vh",
      color: colors.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: colors.surface,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800,
          }}>⛨</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
              AgentWallet
              <span style={{ color: colors.textDim, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                Governance Engine
              </span>
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
              predictor-agent-alpha · kalshi-v2 · {new Date().toISOString().slice(0, 10)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 4,
            background: walletState.killSwitch ? colors.dangerDim : colors.accentDim,
            border: `1px solid ${walletState.killSwitch ? colors.danger : colors.accent}40`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: walletState.killSwitch ? colors.danger : colors.accent,
              animation: isRunning ? "pulse 1s infinite" : "none",
            }} />
            <span style={{
              fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              color: walletState.killSwitch ? colors.danger : colors.accent,
              textTransform: "uppercase",
            }}>
              {walletState.killSwitch ? "Kill Switch Active" : isRunning ? "Processing" : "Ready"}
            </span>
          </div>
          <button onClick={runAllSignals} disabled={isRunning} style={{
            padding: "8px 20px", borderRadius: 6, border: "none",
            background: isRunning ? colors.border : colors.accent,
            color: isRunning ? colors.textDim : colors.bg,
            fontWeight: 700, fontSize: 12, cursor: isRunning ? "default" : "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.02em",
            transition: "all 0.2s",
          }}>
            {isRunning ? `Processing ${processedCount}/${DEMO_SIGNALS.length}...` : "▶ Run Governance Pipeline"}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{
        padding: "16px 24px",
        display: "flex", gap: 12, overflowX: "auto",
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <StatCard label="Balance" value={`$${walletState.balance.toFixed(2)}`} sub={`peak: $${walletState.peakBalance.toFixed(2)}`} />
        <StatCard label="Daily Spend" value={`$${(walletState.dailySpend / 100).toFixed(2)}`} sub={`of $${GOVERNANCE_CONFIG.maxDaily / 100} limit`} color={walletState.dailySpend > GOVERNANCE_CONFIG.maxDaily * 0.8 ? colors.warn : colors.accent} />
        <StatCard label="Approved" value={totalApproved} sub={`of ${processedCount} signals`} color={colors.accent} />
        <StatCard label="Blocked" value={totalBlocked} sub={totalBlocked > 0 ? "guardrails working" : "none yet"} color={totalBlocked > 0 ? colors.danger : colors.textDim} />
        <div style={{
          padding: "16px 20px", background: colors.surface, borderRadius: 8,
          border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 16,
        }}>
          <DrawdownGauge value={walletState.drawdown} threshold={GOVERNANCE_CONFIG.drawdownThreshold} />
          <div>
            <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
              Daily Usage
            </div>
            <ProgressBar value={walletState.dailySpend} max={GOVERNANCE_CONFIG.maxDaily} height={5} />
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              ${(walletState.dailySpend / 100).toFixed(2)} / ${(GOVERNANCE_CONFIG.maxDaily / 100).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: "flex", height: "calc(100vh - 180px)" }}>
        {/* Left: Signals */}
        <div style={{
          width: 320, borderRight: `1px solid ${colors.border}`,
          overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: colors.textMuted, padding: "4px 8px",
          }}>
            Incoming Signals ({DEMO_SIGNALS.length})
          </div>
          {DEMO_SIGNALS.map((sig, i) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              evaluation={evaluations[sig.id]}
              isActive={activeSignal === sig.id}
              onClick={() => setActiveSignal(sig.id)}
              index={i}
              isProcessing={currentProcessing === sig.id}
            />
          ))}
        </div>

        {/* Center: Rule Evaluation */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {activeSignalData && activeEval ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{activeSignalData.market}</span>
                  <Badge color={activeSignalData.direction === "YES" ? "accent" : "danger"} size="md">
                    {activeSignalData.direction} @ {(activeSignalData.price * 100).toFixed(0)}¢
                  </Badge>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <MiniStat label="Contracts" value={activeSignalData.contracts} />
                  <MiniStat label="Cost" value={`$${(activeSignalData.costCents / 100).toFixed(2)}`} />
                  <MiniStat label="Traders" value={`${activeSignalData.numTraders} (${(activeSignalData.conviction * 100).toFixed(0)}%)`} />
                  <MiniStat label="Pool" value={`$${(activeSignalData.totalSize / 1000).toFixed(0)}k`} />
                  <MiniStat label="Category" value={activeSignalData.category} />
                </div>
              </div>

              <div style={{
                padding: "10px 14px", marginBottom: 16, borderRadius: 6,
                background: activeEval.decision === "approved" ? colors.accentDim : colors.dangerDim,
                border: `1px solid ${activeEval.decision === "approved" ? colors.accent : colors.danger}40`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>
                  {activeEval.decision === "approved" ? "✅" : activeEval.decision === "blocked" ? "🚫" : "🛑"}
                </span>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: activeEval.decision === "approved" ? colors.accent : colors.danger,
                    textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {activeEval.decision}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textDim }}>
                    {activeEval.rules.length} rules evaluated · {activeEval.failed.length} failed
                    {activeEval.decision === "approved" && ` · ${activeSignalData.contracts} contracts queued`}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.textMuted, marginBottom: 10 }}>
                Rules Engine Evaluation
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {activeEval.rules.map((rule, i) => (
                  <RuleRow key={rule.id} rule={rule} animate={currentProcessing === activeSignal} delay={i * 120} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: colors.textMuted, gap: 12,
            }}>
              <div style={{ fontSize: 40, opacity: 0.3 }}>⛨</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {processedCount === 0 ? "Click \"Run Governance Pipeline\" to start" : "Select a signal to view evaluation"}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>
                Every signal from the Predictor Agent passes through {GOVERNANCE_CONFIG.allowedQualities.length + 4} rules
                before any money moves.
              </div>
            </div>
          )}
        </div>

        {/* Right: Audit Log */}
        <div style={{
          width: 340, borderLeft: `1px solid ${colors.border}`,
          overflowY: "auto", padding: "12px 16px",
        }} ref={auditRef}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: colors.textMuted, padding: "4px 0", marginBottom: 8,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>Audit Log</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{auditLog.length} entries</span>
          </div>
          {auditLog.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: colors.textMuted, fontSize: 11 }}>
              Audit entries will appear here as signals are processed
            </div>
          ) : (
            auditLog.map((entry, i) => (
              <AuditEntry key={entry.evalId} entry={entry} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
