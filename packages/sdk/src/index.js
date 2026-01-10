require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes
const agentRoutes = require('./routes/agents');
const walletRoutes = require('./routes/wallets');
const ruleRoutes = require('./routes/rules');
const transactionRoutes = require('./routes/transactions');
const stripeRoutes = require('./routes/stripe');
const webhookRoutes = require('./routes/webhooks');

// Middleware
const { authenticateApiKey } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing
app.use(helmet());
app.use(cors());

// Stripe webhooks need raw body - must be before json middleware
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON parsing for all other routes
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (auth required)
app.use('/api/agents', authenticateApiKey, agentRoutes);
app.use('/api/wallets', authenticateApiKey, walletRoutes);
app.use('/api/rules', authenticateApiKey, ruleRoutes);
app.use('/api/transactions', authenticateApiKey, transactionRoutes);
app.use('/api/stripe', authenticateApiKey, stripeRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     AGENT WALLET SDK - v0.1.0             ║
  ║     Financial Rails for AI Agents         ║
  ╠═══════════════════════════════════════════╣
  ║  Server running on port ${PORT}              ║
  ║  Health: http://localhost:${PORT}/health     ║
  ║  Stripe: ${stripeConfigured ? '✓ Configured' : '✗ Not configured'}             ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
