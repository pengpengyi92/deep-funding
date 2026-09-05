# Deep Funding — Team Brief

## 1. 我们现在在做什么？

我们正在 Hackathon 中开发一个 Agent 产品：**Deep Funding**。

**Deep Funding 是一个 Agent-to-Agent 的创业融资与资源匹配平台。**

我们想解决一个非常简单、但长期存在的问题：

> **Founder / Company 想找到适合自己的 Funding；Funding 方也一直在寻找适合自己的 Founder / Company。**

这里的 Funding 不只是“钱”。它可以包括：

- Angel Investment
- Incubator
- Accelerator
- VC
- PE
- Bank
- Corporate / Strategic Investor
- Industrial Fund
- Government Fund
- Grants / Subsidies
- Family Office
- University / Research Program
- 以及资金之外的 Mentorship、Customers、Network、Compute、Office、Industry Resources 等

所以 Deep Funding 真正希望解决的是：

> **让正确的 Founder / Company，在正确的发展阶段，找到正确的 Capital + Resources。**

---

## 2. 为什么需要 Deep Funding？

现实中的融资匹配效率其实很低。

Founder 可能会遇到：

- “我现在到底应该找 Angel、Accelerator、VC、PE 还是银行？”
- “我要准备什么材料？”
- “这个 VC 到底投不投我这个阶段？”
- “为什么投了几十家都没有回应？”

Funding 方也存在相反的问题：

- “这么多项目，我应该先看谁？”
- “这个企业是否符合我们的投资策略？”
- “Founder 的材料完整吗？”
- “企业现在真的达到我们的 Funding Requirement 了吗？”

大量时间消耗在：

**找项目 → 找投资人 → 发材料 → 初筛 → 补材料 → 再筛选 → Meeting**

Deep Funding 希望让 Agent 在双方真正见面之前完成大量标准化工作。

---

## 3. 核心产品：Agent-to-Agent

Deep Funding 最核心的结构非常简单：

```text
Founder / Company
       │
       ▼
Founder Agent
       │
       │ Agent-to-Agent Matching
       │
       ▼
Funding Agent
       │
       ▼
Investor / Institution
```

也就是说：

**不是 Founder 自己一个个寻找 Funding。**

**也不是投资人自己一个个筛 Founder。**

而是双方首先拥有自己的 Agent。Agent 先交流、分析、审计和匹配。

---

## 4. Founder / Company Agent 怎么工作？

Founder 一侧目前有四个核心 Sub-Agent。

### ① Information Agent

负责收集：

- Founder Background
- Team
- Company
- Product
- Demo
- Technology
- Customers
- Revenue
- Traction
- Financials
- Funding Needs
- Geography
- Industry
- Business Model

### ② Analysis Agent

判断公司现在处于什么阶段，例如：

```text
Idea
↓
Pre-Seed
↓
Seed
↓
Series A
↓
Growth
↓
Mature
```

并进一步分析：**现在最适合找什么 Funding？**

### ③ Audit Agent

检查：

- 信息是否完整
- Evidence 是否充分
- 数据是否矛盾
- 是否缺少关键材料
- Funding Readiness 是否足够

### ④ Match Agent

在前面的信息、分析和审计完成以后，开始寻找最合适的 Funding Agent。

---

## 5. Funding Agent

Funding 一侧采用类似的镜像结构：

```text
Information Agent
        ↓
Analysis Agent
        ↓
Audit Agent
        ↓
Match Agent
```

但不同 Funding 类型拥有完全不同的判断标准。

### Angel

可能更加关注：

- Founder
- Co-founder
- Founder-Market Fit
- Vision
- Technical Ability
- Idea
- Execution Speed

### VC

可能更加关注：

- Team
- Product
- Market
- TAM
- Growth
- Traction
- Retention
- Business Model
- Moat

### PE

可能更加关注：

- Revenue
- Profitability
- EBITDA
- Cash Flow
- Financial Statements
- Customer Base
- Management
- Valuation
- Exit Opportunities

### Bank

银行的逻辑又不同，可能更加关注：

- Repayment Source
- Cash Flow
- Creditworthiness
- Debt Capacity
- Collateral
- Guarantee
- Existing Liabilities
- Industry Risk
- Management
- Risk Rating

因此，同一个 Company：

```text
VC Match   = 92%
Bank Match = 35%
```

完全可能是合理的，因为不同 Funding Provider 的目标函数不同。

---

## 6. Deep Funding Knowledge Base

我们正在建立一个 Funding Knowledge Base。第一版大致会包含：

```text
funding/

├── incubators/
├── accelerators/
├── angel/
├── venture_capital/
├── private_equity/
├── banks/
├── strategic_investors/
├── industrial_funds/
├── government/
├── family_offices/
└── university_funds/
```

以后每认识一个机构、投资人、孵化器、银行或者 Funding Program，都可以逐渐沉淀进来。

例如：

```text
Y Combinator
→ Accelerator
→ Early-stage
→ Founder oriented
→ Capital
→ Mentorship
→ Network
→ Demo Day
```

最终这些不只是给人看的 Notes，而会逐渐成为 **Agent 可以读取和匹配的 Machine-readable Funding Profiles**。

---

## 7. 一个 Demo Example

假设：

```text
Company:
AI Agent Startup

Team:
2 Technical Founders

Current Stage:
Hackathon MVP

Traction:
5 Design Partners

Revenue:
$0

Location:
Shenzhen / Hong Kong

Funding Need:
$300K
```

Founder Agent 分析：

```text
Stage:
Pre-Seed

Recommended:

Accelerator      ★★★★★
Angel            ★★★★★
Pre-Seed VC      ★★★★☆
Government       ★★★☆☆
Traditional Bank ★☆☆☆☆
PE               ☆☆☆☆☆
```

然后 Deep Funding 开始寻找具体 Funding Agent：

```text
Founder Agent
     ↓
Funding Analysis
     ↓
Accelerator / Angel / Pre-Seed VC
     ↓
Funding Knowledge Base
     ↓
Candidate Funding Agents
     ↓
A2A Matching
     ↓
Match Score + Reason
     ↓
Human Meeting
```

最终我们希望做到：

> **Agents meet first. Humans meet when it matters.**

---

## 8. Hackathon 第一版需要展示什么？

Hackathon 第一版不需要把整个金融行业全部做完。

最重要的是把一个完整 Story 跑通：

**Founder → Agent → Funding Analysis → Funding Agent → Matching → Result**

让观众能够非常直观地理解：

> “我把公司信息放进去以后，Agent 会判断我现在是什么阶段、应该找什么 Funding，然后跟 Funding Agent 自动匹配。”

---

# Track A — Product / Design / Video

这个方向重点不是写 Agent Backend，而是：

> **怎样让别人 30 秒看懂 Deep Funding？**

## Product UI / UX

可以帮助设计：

- Landing Page
- Founder Profile
- Funding Profile
- Agent Matching
- Match Score
- Funding Readiness
- Agent Conversation / Trace
- Match Result

重点是让产品看起来真的像一个可以使用的 Funding Platform，而不只是 Hackathon Demo。

## Demo Video

我们尤其需要设计一个短 Video，把 A2A Matching 的价值视觉化。

一个可能的 60 秒 Storyboard：

```text
0–10 sec
Founder:
“I built a company. But who should fund me?”
```

```text
10–20 sec
Deep Funding Agent analyzes:
Team / Product / Traction / Financials / Funding Need
```

```text
20–30 sec
Funding Readiness
Pre-Seed
78 / 100
```

```text
30–45 sec
Agents start matching...
Angel Agent
Accelerator Agent
VC Agent
Bank Agent
```

```text
45–55 sec
MATCH
Accelerator   94%
Angel         91%
Seed VC       82%
Bank          31%
PE            12%
```

```text
55–60 sec
Agents meet first.
Humans meet when it matters.

DEEP FUNDING
```

设计方向最有价值的问题是：

> **怎样把 Agent-to-Agent Matching 做得 visually impressive，同时让普通观众一眼看懂？**

---

# Track B — Funding / Finance Domain

另一个非常重要的 Contribution 是：

> **把真实金融行业的判断逻辑带进 Deep Funding。**

尤其希望从实际 Funding Provider 的视角回答问题。

## Bank Perspective

假设你是银行：

> 什么样的 Corporate 是你真正愿意授信的？

可以帮助我们定义：

```text
Bank Matching Policy

Company Age
Revenue
Cash Flow
Debt
Collateral
Guarantee
Industry
Credit History
Management
Repayment Source
Financial Statements
Risk
```

并进一步回答：

- 哪些指标是 Hard Constraint？
- 哪些只是加分项？
- 什么情况直接 Reject？
- 哪些 Evidence 是必须提供的？

## VC Perspective

如果你是 VC：

> 什么样的 Startup 值得进入 Investment Pipeline？

例如：

- Founder
- Team
- Market
- Product
- Traction
- Growth
- TAM
- Moat
- Business Model

## PE Perspective

如果你是 PE：

> 什么样的成熟企业才值得进入 Due Diligence？

以及需要什么 Financial Evidence、经营数据、治理和退出路径信息。

## Angel Perspective

如果你是 Angel：

> 当公司甚至没有 Revenue 时，你到底在赌什么？

例如 Founder、Team、Technology、Vision、Network、Execution 等。

---

## 9. 最有价值的金融 Contribution

我们不需要一开始写一篇几十页的金融报告。

最有价值的是把行业经验转化成结构化规则：

```text
Funding Type
↓
Target Company
↓
Required Information
↓
Evaluation Dimensions
↓
Hard Constraints
↓
Soft Preferences
↓
Red Flags
↓
Required Evidence
↓
Matching Rules
```

因为这些东西最后都可以直接变成：

**Funding Agent Policy。**

也就是说，金融知识不是只进入 PPT，而会真正进入 Agent。

---

## 10. 我们最终想做成什么？

Hackathon 是第一版。

长期我们希望 Deep Funding 能逐渐积累：

```text
Funding Knowledge
+
Company Knowledge
+
Founder Knowledge
+
Financial Knowledge
+
Matching Policies
+
Agent-to-Agent Protocol
```

最终形成：

**Funding Knowledge Graph × Company Knowledge Graph × A2A Matching Engine**

让 Founder 找 Funding，不再只是：

> “我认识谁？”

而逐渐变成：

> **Who is actually the right funding partner for this company, at this stage, and why?**

这就是我们现在正在做的 **Deep Funding**。
