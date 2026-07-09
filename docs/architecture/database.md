# CryptoTrade OS Database Architecture

Version: 1.0

---

# Principles

The database must support:

- Multi-user
- Multi-workspace
- Multi-exchange
- Multiple trading accounts
- Spot
- Margin
- Futures
- Options (future)
- AI features
- Team collaboration
- SaaS subscriptions

---

# Layer 1 — Identity

User

Workspace

WorkspaceMember

Invite

Session

RefreshToken

AuditLog

---

# Layer 2 — Exchange

Exchange

TradingAccount

ApiCredential

ExchangeConnection

---

# Layer 3 — Portfolio

Portfolio

Asset

Balance

Transfer

Deposit

Withdrawal

Wallet

---

# Layer 4 — Trading

Order

Fill

Position

Trade

TradeExecution

TradeFee

LeveragePosition

FundingPayment

Liquidation

---

# Layer 5 — Journal

Journal

JournalEntry

TradeComment

Attachment

Screenshot

Tag

TradeTag

Checklist

Emotion

Mistake

Lesson

---

# Layer 6 — Strategy

Strategy

StrategyVersion

StrategyRule

Indicator

RiskRule

RiskProfile

---

# Layer 7 — Analytics

DailyStatistics

WeeklyStatistics

MonthlyStatistics

PerformanceSnapshot

EquityCurve

Drawdown

PnLHistory

WinRateHistory

RiskMetrics

---

# Layer 8 — AI

AIConversation

AIMessage

PromptTemplate

TradeAnalysis

Recommendation

Insight

---

# Layer 9 — Automation

Alert

Notification

Webhook

AutomationRule

ScheduledJob

---

# Layer 10 — Billing

Plan

Subscription

Invoice

Payment

Coupon

---

# Layer 11 — System

Setting

FeatureFlag

BackgroundJob

MigrationLog