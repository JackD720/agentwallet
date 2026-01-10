<p align="center">
  <img src="https://raw.githubusercontent.com/JackD720/agentwallet/main/assets/logo.svg" width="80" height="80" alt="AgentWallet Logo">
</p>

<h1 align="center">AgentWallet</h1>

<p align="center">
  <strong>Financial infrastructure for AI agents</strong><br>
  Wallets, spend controls, and transaction rails for the agent economy.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node">
</p>

---

## The Problem

AI agents are increasingly capable of taking actions in the world — browsing the web, making purchases, hiring services. But there's no standard infrastructure for agents to:

- Hold and manage funds safely
- Operate within spending guardrails
- Transact with other agents or services
- Maintain audit trails for accountability

## The Solution

AgentWallet provides the financial rails for AI agents:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Owner     │────▶│  Agent(s)   │────▶│  Wallet(s)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         ▼                         │
              ┌─────────────┐          ┌─────────────┐          ┌───────────────┐
              │ Spend Rules │◀────────▶│Rules Engine │─────────▶│ Transactions  │
              └─────────────┘          └─────────────┘          └───────────────┘
```

## Features

🏦 **Agent Wallets** — Each agent gets dedicated wallets with balance tracking

🛡️ **Spend Controls** — Configurable rules: daily limits, per-transaction caps, category restrictions, approval workflows

💸 **Transaction Rails** — Full audit trail with rule evaluation logs for every transaction

🔐 **Dual Authentication** — Separate API keys for owners (full control) and agents (scoped access)

📊 **Dashboard** — Real-time monitoring UI for approvals, transactions, and agent management

🔌 **API-First** — RESTful API designed for agent integration

## Quick Start

### Option 1: SDK Only

```bash
# Clone the repo
git clone https://github.com/JackD720/agentwallet.git
cd agentwallet/packages/sdk

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Run database migrations
npm run db:generate
npm run db:migrate

# Seed test data
node prisma/seed.js

# Start the server
npm run dev
```

Server runs at `http://localhost:3000`

### Option 2: Full Stack (SDK + Dashboard)

```bash
# Terminal 1: Start SDK
cd packages/sdk
npm install && npm run dev

# Terminal 2: Start Dashboard
cd packages/dashboard
npm install && npm run dev
```

Dashboard runs at `http://localhost:5173`

## API Overview

### Create an Agent

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_OWNER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-ai-agent"}'
```

### Create a Wallet

```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer YOUR_OWNER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "AGENT_ID"}'
```

### Add Spend Rules

```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Authorization: Bearer YOUR_OWNER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "WALLET_ID",
    "ruleType": "DAILY_LIMIT",
    "parameters": {"limit": 500}
  }'
```

### Make a Transaction (as Agent)

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "WALLET_ID",
    "amount": 50,
    "category": "advertising",
    "description": "Google Ads spend"
  }'
```

## Spend Rule Types

| Rule | Description | Parameters |
|------|-------------|------------|
| `PER_TRANSACTION_LIMIT` | Max per single transaction | `{limit: number}` |
| `DAILY_LIMIT` | Max spend per day | `{limit: number}` |
| `WEEKLY_LIMIT` | Max spend per week | `{limit: number}` |
| `MONTHLY_LIMIT` | Max spend per month | `{limit: number}` |
| `CATEGORY_WHITELIST` | Only allow certain categories | `{categories: string[]}` |
| `CATEGORY_BLACKLIST` | Block certain categories | `{categories: string[]}` |
| `RECIPIENT_WHITELIST` | Only pay certain recipients | `{recipients: string[]}` |
| `RECIPIENT_BLACKLIST` | Block certain recipients | `{recipients: string[]}` |
| `TIME_WINDOW` | Only allow during certain hours | `{startHour, endHour}` |
| `REQUIRES_APPROVAL` | Flag for human review | `{threshold: number}` |

## Documentation

- [API Reference](./docs/api.md)
- [SDK Integration Guide](./docs/sdk-guide.md)
- [Dashboard Setup](./docs/dashboard.md)
- [Deployment Guide](./docs/deployment.md)

## Roadmap

- [x] Core wallet SDK
- [x] Rules engine
- [x] REST API
- [x] Dashboard UI
- [x] Stripe integration (real payments)
- [ ] Agent-to-agent transfers
- [ ] Escrow for marketplace transactions
- [ ] Webhooks for transaction events
- [ ] TypeScript SDK for agent developers
- [ ] Python SDK
- [ ] Multi-currency support

## Why AgentWallet?

As AI agents become more autonomous, we need infrastructure that:

1. **Enables** agents to participate in economic activity
2. **Constrains** agents to operate within human-defined boundaries
3. **Attributes** actions to responsible parties for accountability

This aligns with emerging research on [agent infrastructure](https://arxiv.org/abs/2501.10114) — the protocols and systems needed for safe, beneficial AI agent deployment.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Areas we'd love help with:
- Stripe/payment integrations
- Additional SDKs (Python, Go)
- Dashboard improvements
- Documentation
- Testing

## License

MIT © Jack Davis

---

<p align="center">
  Built for the agent economy 🤖💰
</p>
