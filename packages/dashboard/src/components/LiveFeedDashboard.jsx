/**
 * Live Feed Dashboard — Redesigned
 * Clean activity feed + tweet generator
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, AlertOctagon, BarChart3, Copy, Check,
  RefreshCw, Loader2, Twitter, ChevronDown, ChevronUp, Clock,
  TrendingUp, Shield, Zap, ExternalLink, Radio
} from 'lucide-react';

const API_BASE = 'https://live-trader-164814074525.us-central1.run.app';

async function apiRequest(method, path) {
  const res = await fetch(`${API_BASE}${path}`, { method });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Feed Item ───────────────────────────────────────────────
const FeedItem = ({ item, index }) => {
  const configs = {
    trade_executed: { icon: CheckCircle, color: 'emerald', label: 'EXECUTED' },
    signal_blocked: { icon: XCircle, color: 'red', label: 'BLOCKED' },
    kill_switch: { icon: AlertOctagon, color: 'amber', label: 'KILL SWITCH' },
    run_summary: { icon: BarChart3, color: 'sky', label: 'CYCLE' },
  };
  const config = configs[item.type] || configs.run_summary;
  const Icon = config.icon;
  const colorMap = {
    emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400', line: 'bg-emerald-500/20' },
    red: { dot: 'bg-red-400', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400', line: 'bg-red-500/20' },
    amber: { dot: 'bg-amber-400', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400', line: 'bg-amber-500/20' },
    sky: { dot: 'bg-sky-400', text: 'text-sky-400', badge: 'bg-sky-500/15 text-sky-400', line: 'bg-sky-500/20' },
  };
  const c = colorMap[config.color];

  const timeAgo = (ts) => {
    if (!ts) return '';
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="flex gap-3 group">
      {/* Timeline */}
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
        <div className={`w-px flex-1 ${c.line} mt-1`} />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${c.badge}`}>
            {config.label}
          </span>
          <span className="text-[10px] text-slate-600">{timeAgo(item.timestamp)}</span>
        </div>

        <p className="text-sm text-slate-200 leading-snug">{item.headline}</p>

        {item.market && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {item.direction && (
              <span className={item.direction === 'YES' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                {item.direction}
              </span>
            )}
            {item.direction && ' on '}<span className="text-slate-400">"{item.market}"</span>
          </p>
        )}

        {item.blocked_by && item.blocked_by.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.blocked_by.map((rule, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/80">
                {rule}
              </span>
            ))}
          </div>
        )}

        {item.type === 'run_summary' && (
          <div className="mt-1.5 flex gap-3 text-[10px]">
            <span className="text-slate-500">Signals: <span className="text-slate-300 font-medium">{item.signals_found}</span></span>
            <span className="text-emerald-400/70">✓ {item.approved}</span>
            <span className="text-red-400/70">✗ {item.blocked}</span>
            {item.executed > 0 && <span className="text-sky-400/70">⚡ {item.executed}</span>}
          </div>
        )}

        {item.rules_checked > 0 && (
          <p className="text-[10px] text-slate-600 mt-1">
            {item.rules_checked} rules{item.rules_failed > 0 && ` · ${item.rules_failed} failed`}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Tweet Card ──────────────────────────────────────────────
const TweetCard = ({ tweet }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tweet.tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-800/20 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/30 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Twitter size={12} className="text-sky-400" />
          <span className="text-xs text-slate-300">{tweet.type === 'blocked_spotlight' ? 'Blocked Spotlight' : 'Daily Recap'}</span>
          <span className="text-[10px] text-slate-600">{tweet.char_count}c</span>
          {tweet.char_count > 280 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400">LONG</span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/30">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{tweet.tweet}</pre>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                copied ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.tweet)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition-all"
            >
              <ExternalLink size={10} /> Post
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────
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
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchTweets = useCallback(async () => {
    setTweetLoading(true);
    try {
      const data = await apiRequest('GET', '/public/tweet');
      setTweets(data.tweets || []);
      setTweetStats(data.stats || null);
    } catch (e) {}
    finally { setTweetLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(); fetchTweets(); }, [fetchFeed, fetchTweets]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFeed]);

  const stats = summary ? [
    { label: 'Processed', value: summary.total_signals_processed ?? 0, color: 'text-slate-200' },
    { label: 'Approved', value: summary.total_approved ?? 0, color: 'text-emerald-400' },
    { label: 'Blocked', value: summary.total_blocked ?? 0, color: 'text-red-400' },
    { label: 'Rate', value: summary.approval_rate ?? '0%', color: 'text-sky-400' },
    { label: 'Kill Switch', value: summary.kill_switch ?? 'OFF', color: summary?.kill_switch === 'ACTIVE' ? 'text-red-400' : 'text-emerald-400' },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchFeed(); fetchTweets(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50 hover:border-slate-600 transition-colors"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50'
            }`}
          >
            <Radio size={11} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
        {stats.length > 0 && (
          <div className="hidden sm:flex items-center gap-4">
            {stats.map((s, i) => (
              <div key={i} className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-slate-600">{s.label}</p>
                <p className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Stats */}
      {stats.length > 0 && (
        <div className="sm:hidden grid grid-cols-5 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-md bg-slate-800/30 border border-slate-700/30 px-2 py-2 text-center">
              <p className="text-[8px] uppercase tracking-wider text-slate-600 mb-0.5">{s.label}</p>
              <p className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-500/8 border border-red-500/20 px-3 py-2.5 text-xs text-red-400">
          Feed unavailable: {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed (2/3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Activity Feed</p>
            <span className="text-[10px] text-slate-600">{feed.length} events</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-slate-600" /></div>
          ) : feed.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700/50 py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
                <Zap size={16} className="text-slate-600" />
              </div>
              <p className="text-xs text-slate-500">No activity yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Run a trade cycle to see events here</p>
            </div>
          ) : (
            <div className="pl-1">
              {feed.map((item, i) => (
                <FeedItem key={`${item.type}-${item.timestamp}-${i}`} item={item} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Tweets (1/3) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tweet Generator</p>
            <button
              onClick={fetchTweets}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              {tweetLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              Regenerate
            </button>
          </div>

          {tweetStats && (
            <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-slate-700/20 border border-slate-700/40 mb-3">
              {[
                { label: 'Trades', value: tweetStats.recent_trades, color: 'text-emerald-400' },
                { label: 'Blocks', value: tweetStats.recent_blocks, color: 'text-red-400' },
                { label: 'Approved', value: tweetStats.lifetime_approved, color: 'text-slate-300' },
                { label: 'Blocked', value: tweetStats.lifetime_blocked, color: 'text-slate-300' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/40 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">{s.label}</p>
                  <p className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {tweets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700/50 py-10 text-center">
              <Twitter size={16} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No tweets to generate</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Run trade cycles first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tweets.map((tweet, i) => (
                <TweetCard key={i} tweet={tweet} />
              ))}
            </div>
          )}

          <div className="mt-3 rounded-md bg-slate-800/20 border border-slate-700/30 px-3 py-2.5">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              <span className="text-slate-500 font-medium">Tip:</span> Screenshot the activity feed + pair with a generated tweet for maximum engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}