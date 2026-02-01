# LucciBot Agent Architecture

Manager-Specialist pattern: One Manager routes to specialized agents.

---

## Overview

```
                    ┌─────────────┐
                    │   MANAGER   │
                    │  (3 tools)  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   TRADING   │ │  SECURITY   │ │   HISTORY   │
    │  (4 tools)  │ │  (3 tools)  │ │  (3 tools)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Manager

Routes user requests to the appropriate specialist.

### Manager Tools

| Tool | Description |
|------|-------------|
| `call_trading_specialist` | Balances, swaps, transfers |
| `call_security_specialist` | Approvals, simulations, risk checks |
| `call_history_specialist` | Transactions, portfolio, analytics |

### Manager Prompt

```
You are a crypto wallet manager. Route the user's request to ONE specialist:

- trading: balances, swaps, sends, token transfers
- security: approvals, revokes, transaction simulation
- history: past transactions, portfolio stats, PnL

Respond: { "specialist": "<name>", "task": "<what to do>" }
```

---

## Trading Specialist

Handles all value transfer operations.

### Tools

| Tool | Description |
|------|-------------|
| `get_balance` | Get wallet balances (native + tokens) |
| `swap_quote` | Get quote for token swap |
| `swap` | Execute token swap |
| `send` | Send tokens to address |

### Tool Details

**get_balance**
```
Params: { chain?: string }
Returns: { native: {symbol, balance, usd}, tokens: [...], total_usd }
```

**swap_quote**
```
Params: { from_token, to_token, amount, chain? }
Returns: { to_amount, price_impact, gas_usd, route }
```

**swap**
```
Params: { from_token, to_token, amount, slippage?, chain? }
Returns: { tx_hash, status, from_amount, to_amount }
```

**send**
```
Params: { to, token, amount, chain? }
Returns: { tx_hash, status }
```

---

## Security Specialist

Handles approvals, risk assessment, and transaction safety.

### Tools

| Tool | Description |
|------|-------------|
| `get_approvals` | List all token approvals |
| `revoke_approval` | Revoke a token approval |
| `simulate_tx` | Simulate transaction effects |

### Tool Details

**get_approvals**
```
Params: { chain? }
Returns: { approvals: [{ token, spender, spender_name, allowance, is_risky }] }
```

**revoke_approval**
```
Params: { token, spender, chain }
Returns: { tx_hash, status }
```

**simulate_tx**
```
Params: { to, value?, data?, chain }
Returns: { success, balance_changes: [{ token, change }], warnings }
```

---

## History Specialist

Handles transaction history and portfolio analytics.

### Tools

| Tool | Description |
|------|-------------|
| `get_transactions` | Get transaction history |
| `get_portfolio` | Get portfolio breakdown |
| `get_pnl` | Get profit/loss stats |

### Tool Details

**get_transactions**
```
Params: { chain?, type?: "all"|"send"|"swap", limit?: 10 }
Returns: { transactions: [{ hash, type, timestamp, status, ... }] }
```

**get_portfolio**
```
Params: { }
Returns: { total_usd, by_chain: {...}, top_holdings: [...] }
```

**get_pnl**
```
Params: { period?: "24h"|"7d"|"30d" }
Returns: { total_pnl_usd, pnl_percent, realized, unrealized }
```

---

## Flow Example

```
User: "Swap 1 ETH for USDC"

1. MANAGER receives request
   → Detects: token trading intent
   → Calls: call_trading_specialist("swap 1 ETH for USDC")

2. TRADING SPECIALIST receives task
   → Calls: swap_quote(from="ETH", to="USDC", amount="1")
   → Calls: swap(from="ETH", to="USDC", amount="1")
   → Returns: { tx_hash, to_amount }

3. MANAGER formats response
   → "Swapped 1 ETH for 2,000 USDC. Tx: 0xabc..."
```

---

## Supported Chains

| ID | Name |
|----|------|
| `ethereum` | Ethereum |
| `arbitrum` | Arbitrum |
| `base` | Base |
| `polygon` | Polygon |
