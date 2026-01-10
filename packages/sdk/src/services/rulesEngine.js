const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Rules Engine
 * Evaluates spend rules for a wallet before allowing transactions
 */

class RulesEngine {
  
  /**
   * Evaluate all active rules for a transaction
   * Returns { approved: boolean, results: [], requiresApproval: boolean }
   */
  async evaluateTransaction(walletId, transaction) {
    const { amount, category, recipientId } = transaction;
    
    // Get all active rules for this wallet, ordered by priority
    const rules = await prisma.spendRule.findMany({
      where: { walletId, active: true },
      orderBy: { priority: 'desc' }
    });

    const results = [];
    let approved = true;
    let requiresApproval = false;

    for (const rule of rules) {
      const result = await this.evaluateRule(rule, walletId, transaction);
      results.push({
        ruleId: rule.id,
        ruleType: rule.ruleType,
        passed: result.passed,
        reason: result.reason,
        details: result.details
      });

      if (!result.passed) {
        approved = false;
      }

      if (result.requiresApproval) {
        requiresApproval = true;
      }
    }

    return {
      approved,
      requiresApproval,
      results,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(rule, walletId, transaction) {
    const { amount, category, recipientId } = transaction;
    const params = rule.parameters;

    switch (rule.ruleType) {
      case 'PER_TRANSACTION_LIMIT':
        return this.checkPerTransactionLimit(amount, params);

      case 'DAILY_LIMIT':
        return await this.checkDailyLimit(walletId, amount, params);

      case 'WEEKLY_LIMIT':
        return await this.checkWeeklyLimit(walletId, amount, params);

      case 'MONTHLY_LIMIT':
        return await this.checkMonthlyLimit(walletId, amount, params);

      case 'CATEGORY_WHITELIST':
        return this.checkCategoryWhitelist(category, params);

      case 'CATEGORY_BLACKLIST':
        return this.checkCategoryBlacklist(category, params);

      case 'RECIPIENT_WHITELIST':
        return this.checkRecipientWhitelist(recipientId, params);

      case 'RECIPIENT_BLACKLIST':
        return this.checkRecipientBlacklist(recipientId, params);

      case 'TIME_WINDOW':
        return this.checkTimeWindow(params);

      case 'REQUIRES_APPROVAL':
        return this.checkRequiresApproval(amount, params);

      default:
        return { passed: true, reason: 'Unknown rule type - skipped' };
    }
  }

  // ============ RULE IMPLEMENTATIONS ============

  checkPerTransactionLimit(amount, params) {
    const limit = parseFloat(params.limit);
    const passed = amount <= limit;
    return {
      passed,
      reason: passed 
        ? `Amount $${amount} within per-transaction limit of $${limit}`
        : `Amount $${amount} exceeds per-transaction limit of $${limit}`,
      details: { amount, limit }
    };
  }

  async checkDailyLimit(walletId, amount, params) {
    const limit = parseFloat(params.limit);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySpend = await this.getSpendSince(walletId, today);
    const projectedTotal = todaySpend + amount;
    const passed = projectedTotal <= limit;

    return {
      passed,
      reason: passed
        ? `Daily spend $${projectedTotal.toFixed(2)} within limit of $${limit}`
        : `Daily spend would be $${projectedTotal.toFixed(2)}, exceeds limit of $${limit}`,
      details: { todaySpend, amount, projectedTotal, limit }
    };
  }

  async checkWeeklyLimit(walletId, amount, params) {
    const limit = parseFloat(params.limit);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekSpend = await this.getSpendSince(walletId, weekStart);
    const projectedTotal = weekSpend + amount;
    const passed = projectedTotal <= limit;

    return {
      passed,
      reason: passed
        ? `Weekly spend $${projectedTotal.toFixed(2)} within limit of $${limit}`
        : `Weekly spend would be $${projectedTotal.toFixed(2)}, exceeds limit of $${limit}`,
      details: { weekSpend, amount, projectedTotal, limit }
    };
  }

  async checkMonthlyLimit(walletId, amount, params) {
    const limit = parseFloat(params.limit);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthSpend = await this.getSpendSince(walletId, monthStart);
    const projectedTotal = monthSpend + amount;
    const passed = projectedTotal <= limit;

    return {
      passed,
      reason: passed
        ? `Monthly spend $${projectedTotal.toFixed(2)} within limit of $${limit}`
        : `Monthly spend would be $${projectedTotal.toFixed(2)}, exceeds limit of $${limit}`,
      details: { monthSpend, amount, projectedTotal, limit }
    };
  }

  checkCategoryWhitelist(category, params) {
    const allowed = params.categories || [];
    const passed = !category || allowed.includes(category);
    return {
      passed,
      reason: passed
        ? `Category "${category || 'none'}" is allowed`
        : `Category "${category}" not in whitelist: ${allowed.join(', ')}`,
      details: { category, allowed }
    };
  }

  checkCategoryBlacklist(category, params) {
    const blocked = params.categories || [];
    const passed = !category || !blocked.includes(category);
    return {
      passed,
      reason: passed
        ? `Category "${category || 'none'}" is not blocked`
        : `Category "${category}" is blacklisted`,
      details: { category, blocked }
    };
  }

  checkRecipientWhitelist(recipientId, params) {
    const allowed = params.recipients || [];
    const passed = !recipientId || allowed.includes(recipientId);
    return {
      passed,
      reason: passed
        ? `Recipient is allowed`
        : `Recipient not in whitelist`,
      details: { recipientId, allowedCount: allowed.length }
    };
  }

  checkRecipientBlacklist(recipientId, params) {
    const blocked = params.recipients || [];
    const passed = !recipientId || !blocked.includes(recipientId);
    return {
      passed,
      reason: passed
        ? `Recipient is not blocked`
        : `Recipient is blacklisted`,
      details: { recipientId }
    };
  }

  checkTimeWindow(params) {
    const { startHour, endHour, timezone = 'UTC' } = params;
    const now = new Date();
    const currentHour = now.getUTCHours(); // Simplified - should use timezone
    
    const passed = currentHour >= startHour && currentHour < endHour;
    return {
      passed,
      reason: passed
        ? `Current time is within allowed window (${startHour}:00 - ${endHour}:00)`
        : `Current time is outside allowed window (${startHour}:00 - ${endHour}:00)`,
      details: { currentHour, startHour, endHour }
    };
  }

  checkRequiresApproval(amount, params) {
    const threshold = parseFloat(params.threshold);
    const requiresApproval = amount > threshold;
    return {
      passed: true, // This rule doesn't block, just flags
      requiresApproval,
      reason: requiresApproval
        ? `Amount $${amount} exceeds approval threshold of $${threshold} - flagged for review`
        : `Amount $${amount} below approval threshold`,
      details: { amount, threshold, requiresApproval }
    };
  }

  // ============ HELPERS ============

  async getSpendSince(walletId, since) {
    const result = await prisma.transaction.aggregate({
      where: {
        walletId,
        status: 'COMPLETED',
        createdAt: { gte: since }
      },
      _sum: { amount: true }
    });
    return parseFloat(result._sum.amount || 0);
  }
}

module.exports = new RulesEngine();
