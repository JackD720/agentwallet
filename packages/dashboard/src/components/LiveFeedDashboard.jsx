import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, AlertOctagon, BarChart3, Copy, Check,
  RefreshCw, Loader2, Twitter, ChevronDown, ChevronUp, Clock,
  TrendingUp, Shield, Zap, ExternalLink
} from 'lucide-react';

const API_BASE = 'https://live-trader-164814074525.us-central1.run.app';

async function apiRequest(method, path) {
  const res = await fetch(`${API_BASE}${path}`, { method });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Feed Item Component ──────────────────────────────────────

const FeedItem = ({ item }) => {
  const typeConfig = {
    trade_executed: {
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      label: 'TRADE EXECUTED',
      labelColor: 'text-emerald-400 bg-emerald-500/20',
    },
    signal_blocked: {
      icon: XCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'BLOCKED',
      labelColor: 'text-red-400 bg-red-500/20',
    },
    kill_switch: {
      icon: AlertOctagon,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      label: 'KILL SWITCH',
      labelColor: 'text-amber-400 bg-amber-500/20',
    },
    run_summary: {
      icon: BarChart3,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      label: 'CYCLE COMPLETE',
      labelColor: 'text-indigo-400 bg-indigo-500/20',
    },
  };

  const config = typeConfig[item.type] || typeConfig.run_summary;
  const Icon = config.icon;

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 transition-all hover:border-opacity-60`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${config.labelColor}`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-500">{timeAgo(item.timestamp)}</span>
          </div>

          <p className="text-sm text-slate-200 font-medium leading-snug">
            {item.headline}
          </p>

          {item.market && (
            <p className="text-sm text-slate-400 mt-1 truncate">
              {item.direction && (
                <span className={`font-semibold ${item.direction === 'YES' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.direction}
                </span>
              )}
              {item.direction && ' on '}"{item.market}"
            </p>
          )}

          {/* Blocked rules */}
          {item.blocked_by && item.blocked_by.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.blocked_by.map((rule, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {rule}
                </span>
              ))}
            </div>
          )}

          {/* Run summary stats */}
          {item.type === 'run_summary' && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-slate-400">
                Signals: <span className="text-slate-200 font-medium">{item.signals_found}</span>
              </span>
              <span className="text-emerald-400">
                ✓ {item.approved} approved
              </span>
              <span className="text-red-400">
                ✗ {item.blocked} blocked
              </span>
              {item.executed > 0 && (
                <span className="text-indigo-400">
                  ⚡ {item.executed} executed
                </span>
              )}
            </div>
          )}

          {/* Kill switch reason */}
          {item.type === 'kill_switch' && item.reason && (
            <p className="text-sm text-amber-400/80 mt-1">
              Reason: {item.reason}
            </p>
          )}

          {/* Rules checked */}
          {item.rules_checked > 0 && (
            <p className="text-[11px] text-slate-500 mt-1.5">
              {item.rules_checked} rules evaluated
              {item.rules_failed > 0 && ` · ${item.rules_failed} failed`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tweet Card Component ─────────────────────────────────────

const TweetCard = ({ tweet }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tweet.tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabels = {
    daily_recap: { label: 'Daily Recap', icon: BarChart3, color: 'text-indigo-400' },
    blocked_spotlight: { label: 'Blocked Trade Spotlight', icon: Shield, color: 'text-red-400' },
  };

  const config = typeLabels[tweet.type] || typeLabels.daily_recap;
  const TypeIcon = config.icon;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <TypeIcon size={16} className={config.color} />
          <span className="text-sm font-medium text-slate-200">{config.label}</span>
          <span className="text-xs text-slate-500">{tweet.char_count} chars</span>
          {tweet.char_count > 280 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              LONG — may need thread
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {/* Tweet Content */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/30">
            <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {tweet.tweet}
            </pre>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Tweet'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.tweet)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all"
            >
              <Twitter size={14} />
              Open in Twitter
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Stats Bar ────────────────────────────────────────────────

const StatsBar = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {[
        { label: 'Signals Processed', value: summary.total_signals_processed, icon: Zap, color: 'text-indigo-400' },
        { label: 'Approved', value: summary.total_approved, icon: CheckCircle, color: 'text-emerald-400' },
        { label: 'Blocked', value: summary.total_blocked, icon: XCircle, color: 'text-red-400' },
        { label: 'Approval Rate', value: summary.approval_rate, icon: TrendingUp, color: 'text-sky-400' },
        { label: 'Kill Switch', value: summary.kill_switch, icon: AlertOctagon, color: summary.kill_switch === 'ACTIVE' ? 'text-red-400' : 'text-emerald-400' },
      ].map((stat, i) => (
        <div key={i} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <stat.icon size={14} className={stat.color} />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color}`}>{stat.value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────

export default function LiveFeedDashboard() {
  const [feed, setFeed] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tweetStats, setTweetStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await apiRequest('GET', '/public/feed?limit=30');
      setFeed(data.feed || []);
      setSummary(data.summary || null);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTweets = useCallback(async () => {
    setTweetLoading(true);
    try {
      const data = await apiRequest('GET', '/public/tweet');
      setTweets(data.tweets || []);
      setTweetStats(data.stats || null);
    } catch (e) {
      console.error('Tweet fetch failed:', e);
    } finally {
      setTweetLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
    fetchTweets();
  }, [fetchFeed, fetchTweets]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFeed]);

  return (
    <div>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchFeed(); fetchTweets(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50'
            }`}
          >
            <Clock size={14} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar summary={summary} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm text-red-400">
          Failed to load feed: {error}. Make sure the live trader is running and the /public/feed endpoint is deployed.
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed Column (2/3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Activity Feed
            </h3>
            <span className="text-xs text-slate-500">{feed.length} events</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-12 text-center">
              <Zap size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No activity yet</p>
              <p className="text-slate-500 text-xs mt-1">Run a trade cycle to see events here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item, i) => (
                <FeedItem key={`${item.type}-${item.timestamp}-${i}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Tweets Column (1/3) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Tweet Generator
            </h3>
            <button
              onClick={fetchTweets}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {tweetLoading ? <Loader2 size={14} className="animate-spin" /> : 'Regenerate'}
            </button>
          </div>

          {/* Tweet Stats */}
          {tweetStats && (
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 mb-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Recent trades</span>
                  <p className="text-emerald-400 font-bold">{tweetStats.recent_trades}</p>
                </div>
                <div>
                  <span className="text-slate-500">Recent blocks</span>
                  <p className="text-red-400 font-bold">{tweetStats.recent_blocks}</p>
                </div>
                <div>
                  <span className="text-slate-500">Lifetime approved</span>
                  <p className="text-slate-200 font-bold">{tweetStats.lifetime_approved}</p>
                </div>
                <div>
                  <span className="text-slate-500">Lifetime blocked</span>
                  <p className="text-slate-200 font-bold">{tweetStats.lifetime_blocked}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tweet Cards */}
          {tweets.length === 0 ? (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-8 text-center">
              <Twitter size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No tweets to generate</p>
              <p className="text-slate-500 text-xs mt-1">Run some trade cycles first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tweets.map((tweet, i) => (
                <TweetCard key={i} tweet={tweet} />
              ))}
            </div>
          )}

          {/* Manual Tweet Tip */}
          <div className="mt-4 rounded-lg border border-slate-700/30 bg-slate-800/20 p-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-400">Tip:</strong> Take a screenshot of the activity feed 
              or the Kalshi Trading page, then pair it with a generated tweet for maximum engagement.
              Blocked trade callouts get the most interaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
