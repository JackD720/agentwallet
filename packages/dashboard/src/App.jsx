import React, { useState, useEffect } from 'react';
import { 
  Wallet, Bot, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, 
  XCircle, AlertCircle, Shield, Activity, DollarSign, Users,
  ChevronRight, Settings, LogOut, Search, Bell, Plus, Filter
} from 'lucide-react';

// Mock API - Replace with real API calls
const mockData = {
  owner: { name: 'Jack', email: 'jack@example.com' },
  stats: {
    totalAgents: 3,
    activeWallets: 5,
    totalBalance: 12450.00,
    pendingApprovals: 2,
    todayTransactions: 23,
    todayVolume: 1847.50
  },
  agents: [
    { id: '1', name: 'ad-buyer-agent', status: 'ACTIVE', walletCount: 2, totalBalance: 5200, lastActive: '2 min ago' },
    { id: '2', name: 'content-writer', status: 'ACTIVE', walletCount: 1, totalBalance: 3100, lastActive: '15 min ago' },
    { id: '3', name: 'data-scraper', status: 'PAUSED', walletCount: 2, totalBalance: 4150, lastActive: '2 hours ago' }
  ],
  transactions: [
    { id: 't1', agentName: 'ad-buyer-agent', amount: 75.00, category: 'advertising', status: 'COMPLETED', time: '2 min ago', description: 'Google Ads spend' },
    { id: 't2', agentName: 'content-writer', amount: 150.00, category: 'software', status: 'AWAITING_APPROVAL', time: '5 min ago', description: 'Jasper AI subscription' },
    { id: 't3', agentName: 'ad-buyer-agent', amount: 45.00, category: 'advertising', status: 'COMPLETED', time: '12 min ago', description: 'Meta Ads' },
    { id: 't4', agentName: 'data-scraper', amount: 200.00, category: 'infrastructure', status: 'AWAITING_APPROVAL', time: '1 hour ago', description: 'Proxy service' },
    { id: 't5', agentName: 'ad-buyer-agent', amount: 125.00, category: 'advertising', status: 'REJECTED', time: '2 hours ago', description: 'TikTok Ads - exceeded daily limit' },
    { id: 't6', agentName: 'content-writer', amount: 29.00, category: 'software', status: 'COMPLETED', time: '3 hours ago', description: 'Grammarly' }
  ],
  pendingApprovals: [
    { 
      id: 't2', 
      agentName: 'content-writer', 
      amount: 150.00, 
      category: 'software', 
      description: 'Jasper AI subscription',
      reason: 'Exceeds approval threshold of $100',
      time: '5 min ago'
    },
    { 
      id: 't4', 
      agentName: 'data-scraper', 
      amount: 200.00, 
      category: 'infrastructure', 
      description: 'Proxy service',
      reason: 'Exceeds approval threshold of $100',
      time: '1 hour ago'
    }
  ]
};

// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };
  
  const icons = {
    ACTIVE: <Activity size={12} />,
    PAUSED: <Clock size={12} />,
    COMPLETED: <CheckCircle size={12} />,
    AWAITING_APPROVAL: <AlertCircle size={12} />,
    REJECTED: <XCircle size={12} />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
      {icons[status]}
      {status.replace('_', ' ')}
    </span>
  );
};

// Metric card component
const MetricCard = ({ icon: Icon, label, value, subValue, trend }) => (
  <div className="metric-card">
    <div className="flex items-start justify-between">
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
    {subValue && <p className="text-xs text-slate-500 mt-2">{subValue}</p>}
  </div>
);

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(mockData);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleApprove = (id) => {
    console.log('Approving:', id);
    // API call would go here
  };

  const handleReject = (id) => {
    console.log('Rejecting:', id);
    // API call would go here
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Wallet size={20} />
            </div>
            <span className="logo-text">AgentWallet</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem 
            icon={Activity} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <NavItem 
            icon={Bot} 
            label="Agents" 
            active={activeTab === 'agents'} 
            onClick={() => setActiveTab('agents')}
            badge={data.stats.totalAgents}
          />
          <NavItem 
            icon={Wallet} 
            label="Wallets" 
            active={activeTab === 'wallets'} 
            onClick={() => setActiveTab('wallets')} 
          />
          <NavItem 
            icon={ArrowUpRight} 
            label="Transactions" 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
          />
          <NavItem 
            icon={AlertCircle} 
            label="Approvals" 
            active={activeTab === 'approvals'} 
            onClick={() => setActiveTab('approvals')}
            badge={data.stats.pendingApprovals}
            badgeColor="amber"
          />
          <NavItem 
            icon={Shield} 
            label="Rules" 
            active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')} 
          />
        </nav>

        <div className="sidebar-footer">
          <NavItem icon={Settings} label="Settings" />
          <div className="user-card">
            <div className="user-avatar">{data.owner.name[0]}</div>
            <div className="user-info">
              <p className="user-name">{data.owner.name}</p>
              <p className="user-email">{data.owner.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'agents' && 'AI Agents'}
              {activeTab === 'wallets' && 'Wallets'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'approvals' && 'Pending Approvals'}
              {activeTab === 'rules' && 'Spend Rules'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'overview' && 'Monitor your AI agent financial activity'}
              {activeTab === 'agents' && 'Manage your AI agents and their permissions'}
              {activeTab === 'approvals' && `${data.stats.pendingApprovals} transactions need your review`}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-icon">
              <Search size={18} />
            </button>
            <button className="btn-icon notification-btn">
              <Bell size={18} />
              {data.stats.pendingApprovals > 0 && <span className="notification-dot" />}
            </button>
            <button className="btn-primary">
              <Plus size={16} />
              New Agent
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'overview' && (
            <OverviewTab data={data} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'agents' && (
            <AgentsTab agents={data.agents} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab transactions={data.transactions} />
          )}
          {activeTab === 'approvals' && (
            <ApprovalsTab 
              approvals={data.pendingApprovals} 
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeTab === 'rules' && (
            <RulesTab />
          )}
        </div>
      </main>
    </div>
  );
}

// Navigation Item
const NavItem = ({ icon: Icon, label, active, onClick, badge, badgeColor = 'slate' }) => (
  <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={18} />
    <span>{label}</span>
    {badge && (
      <span className={`nav-badge ${badgeColor === 'amber' ? 'nav-badge-amber' : ''}`}>
        {badge}
      </span>
    )}
  </button>
);

// Overview Tab
const OverviewTab = ({ data, setActiveTab }) => (
  <>
    {/* Metrics Grid */}
    <div className="metrics-grid">
      <MetricCard 
        icon={Bot} 
        label="Active Agents" 
        value={data.stats.totalAgents}
        subValue="2 active, 1 paused"
      />
      <MetricCard 
        icon={DollarSign} 
        label="Total Balance" 
        value={`$${data.stats.totalBalance.toLocaleString()}`}
        trend={12}
      />
      <MetricCard 
        icon={Activity} 
        label="Today's Transactions" 
        value={data.stats.todayTransactions}
        subValue={`$${data.stats.todayVolume.toLocaleString()} volume`}
        trend={8}
      />
      <MetricCard 
        icon={AlertCircle} 
        label="Pending Approvals" 
        value={data.stats.pendingApprovals}
        subValue="Requires your attention"
      />
    </div>

    {/* Two Column Layout */}
    <div className="two-column">
      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Transactions</h3>
          <button className="btn-text" onClick={() => setActiveTab('transactions')}>
            View all <ChevronRight size={16} />
          </button>
        </div>
        <div className="transaction-list">
          {data.transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-icon">
                {tx.status === 'COMPLETED' ? (
                  <ArrowUpRight size={16} className="text-emerald-400" />
                ) : tx.status === 'REJECTED' ? (
                  <XCircle size={16} className="text-red-400" />
                ) : (
                  <Clock size={16} className="text-amber-400" />
                )}
              </div>
              <div className="transaction-details">
                <p className="transaction-desc">{tx.description}</p>
                <p className="transaction-meta">{tx.agentName} • {tx.time}</p>
              </div>
              <div className="transaction-amount">
                <p className={tx.status === 'REJECTED' ? 'text-red-400 line-through' : ''}>
                  ${tx.amount.toFixed(2)}
                </p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="card">
        <div className="card-header">
          <h3>Needs Approval</h3>
          <button className="btn-text" onClick={() => setActiveTab('approvals')}>
            Review all <ChevronRight size={16} />
          </button>
        </div>
        {data.pendingApprovals.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={40} className="text-emerald-400" />
            <p>All caught up!</p>
          </div>
        ) : (
          <div className="approval-list">
            {data.pendingApprovals.map(item => (
              <div key={item.id} className="approval-item">
                <div className="approval-header">
                  <span className="approval-agent">{item.agentName}</span>
                  <span className="approval-amount">${item.amount.toFixed(2)}</span>
                </div>
                <p className="approval-desc">{item.description}</p>
                <p className="approval-reason">{item.reason}</p>
                <div className="approval-actions">
                  <button className="btn-approve">Approve</button>
                  <button className="btn-reject">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Agents Overview */}
    <div className="card">
      <div className="card-header">
        <h3>Agent Overview</h3>
        <button className="btn-text" onClick={() => setActiveTab('agents')}>
          Manage agents <ChevronRight size={16} />
        </button>
      </div>
      <div className="agents-grid">
        {data.agents.map(agent => (
          <div key={agent.id} className="agent-card-mini">
            <div className="agent-card-header">
              <div className="agent-avatar">
                <Bot size={20} />
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <h4 className="agent-name">{agent.name}</h4>
            <div className="agent-stats">
              <div>
                <p className="stat-value">${agent.totalBalance.toLocaleString()}</p>
                <p className="stat-label">Balance</p>
              </div>
              <div>
                <p className="stat-value">{agent.walletCount}</p>
                <p className="stat-label">Wallets</p>
              </div>
            </div>
            <p className="agent-last-active">Last active: {agent.lastActive}</p>
          </div>
        ))}
      </div>
    </div>
  </>
);

// Agents Tab
const AgentsTab = ({ agents }) => (
  <div className="card">
    <div className="card-header">
      <h3>All Agents</h3>
      <div className="header-actions">
        <button className="btn-secondary">
          <Filter size={16} />
          Filter
        </button>
        <button className="btn-primary">
          <Plus size={16} />
          Create Agent
        </button>
      </div>
    </div>
    <table className="data-table">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Status</th>
          <th>Wallets</th>
          <th>Total Balance</th>
          <th>Last Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {agents.map(agent => (
          <tr key={agent.id}>
            <td>
              <div className="agent-cell">
                <div className="agent-avatar-sm">
                  <Bot size={16} />
                </div>
                <span>{agent.name}</span>
              </div>
            </td>
            <td><StatusBadge status={agent.status} /></td>
            <td>{agent.walletCount}</td>
            <td className="font-mono">${agent.totalBalance.toLocaleString()}</td>
            <td className="text-slate-400">{agent.lastActive}</td>
            <td>
              <div className="action-buttons">
                <button className="btn-sm">View</button>
                <button className="btn-sm btn-outline">
                  {agent.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Transactions Tab
const TransactionsTab = ({ transactions }) => (
  <div className="card">
    <div className="card-header">
      <h3>Transaction History</h3>
      <div className="header-actions">
        <button className="btn-secondary">
          <Filter size={16} />
          Filter
        </button>
      </div>
    </div>
    <table className="data-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Agent</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => (
          <tr key={tx.id}>
            <td>{tx.description}</td>
            <td className="text-slate-400">{tx.agentName}</td>
            <td>
              <span className="category-badge">{tx.category}</span>
            </td>
            <td className={`font-mono ${tx.status === 'REJECTED' ? 'text-red-400 line-through' : ''}`}>
              ${tx.amount.toFixed(2)}
            </td>
            <td><StatusBadge status={tx.status} /></td>
            <td className="text-slate-400">{tx.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Approvals Tab
const ApprovalsTab = ({ approvals, onApprove, onReject }) => (
  <div className="approvals-container">
    {approvals.length === 0 ? (
      <div className="card empty-state-large">
        <CheckCircle size={60} className="text-emerald-400" />
        <h3>All caught up!</h3>
        <p>No transactions pending approval</p>
      </div>
    ) : (
      approvals.map(item => (
        <div key={item.id} className="approval-card">
          <div className="approval-card-header">
            <div className="approval-agent-info">
              <div className="agent-avatar">
                <Bot size={20} />
              </div>
              <div>
                <h4>{item.agentName}</h4>
                <p className="text-slate-400">{item.time}</p>
              </div>
            </div>
            <div className="approval-amount-large">
              ${item.amount.toFixed(2)}
            </div>
          </div>
          
          <div className="approval-card-body">
            <div className="approval-detail">
              <span className="detail-label">Description</span>
              <span className="detail-value">{item.description}</span>
            </div>
            <div className="approval-detail">
              <span className="detail-label">Category</span>
              <span className="category-badge">{item.category}</span>
            </div>
            <div className="approval-detail">
              <span className="detail-label">Flagged Reason</span>
              <span className="detail-value text-amber-400">{item.reason}</span>
            </div>
          </div>

          <div className="approval-card-actions">
            <button className="btn-reject-large" onClick={() => onReject(item.id)}>
              <XCircle size={18} />
              Reject
            </button>
            <button className="btn-approve-large" onClick={() => onApprove(item.id)}>
              <CheckCircle size={18} />
              Approve
            </button>
          </div>
        </div>
      ))
    )}
  </div>
);

// Rules Tab
const RulesTab = () => {
  const rules = [
    { id: 1, type: 'PER_TRANSACTION_LIMIT', params: { limit: 100 }, agent: 'ad-buyer-agent', active: true },
    { id: 2, type: 'DAILY_LIMIT', params: { limit: 500 }, agent: 'ad-buyer-agent', active: true },
    { id: 3, type: 'REQUIRES_APPROVAL', params: { threshold: 75 }, agent: 'ad-buyer-agent', active: true },
    { id: 4, type: 'CATEGORY_WHITELIST', params: { categories: ['advertising', 'software'] }, agent: 'content-writer', active: true },
    { id: 5, type: 'MONTHLY_LIMIT', params: { limit: 2000 }, agent: 'content-writer', active: false }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3>Spend Rules</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Rule
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Rule Type</th>
            <th>Parameters</th>
            <th>Agent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => (
            <tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
              <td>
                <span className="rule-type">{rule.type.replace(/_/g, ' ')}</span>
              </td>
              <td className="font-mono text-sm">
                {JSON.stringify(rule.params)}
              </td>
              <td className="text-slate-400">{rule.agent}</td>
              <td>
                <span className={`status-dot ${rule.active ? 'active' : 'inactive'}`}>
                  {rule.active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn-sm">Edit</button>
                  <button className="btn-sm btn-outline">
                    {rule.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
