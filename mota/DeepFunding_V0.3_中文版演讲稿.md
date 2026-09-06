# Deep Funding V0.3 中文版汇报演讲稿

**演讲人：彭鹏一**  
**项目：Deep Funding**  
**版本：V0.3**  
**日期：2026-09-06**

## 开场

各位好，我是彭鹏一。

今天给大家介绍我们的项目——**Deep Funding**。

Deep Funding 想解决的，其实是一个非常简单但长期存在的问题：

**需要资金的人，和拥有资金与资源的人，怎样更高效、更结构化地找到彼此？**

一边是创业者和企业。他们有自己的公司信息、团队、产品、融资需求、资金用途，以及大量需要提供和验证的材料。

另一边是 VC、PE、银行、产业资本、孵化器等 Funding Provider。他们也有自己的投资偏好、准入条件、资本类型、资源能力和风险要求。

所以我们想做的，并不是又一个简单的信息发布平台。

我们希望建立的是一个 **Agent-to-Agent 的 Funding Matching Protocol**。

也就是说，在真正的人与人开始沟通之前，先让双方的 Agent 完成资料整理、分析、审计和初步匹配。

最终的沟通和融资决策仍然由人来完成。

## 第二页：双边 Agent

整个 Deep Funding 有两个顶层 Agent。

一边是 **Company Agent**，代表企业或者 Founder；另一边是 **Funding Agent**，代表资金方。

两边下面都有四个核心职责：**Information、Analysis、Audit、Match**。

Information Agent 负责把信息结构化；Analysis Agent 负责分析企业需求和资金方要求；Audit Agent 负责找出证据缺失、信息冲突和未经支持的 Claims；Match Agent 最后形成一个可以解释的候选匹配结果。

现在的 V0.3 是一个**可运行的工程原型**。这些 Agent Role 当前主要由 deterministic service 和事件记录实现，并不是说我们已经同时调用了八个大模型。我们的目标是先把整个协议、数据结构和 workflow 做正确。

## 第三页：V0.1——先把闭环跑通

第一个版本 V0.1，只解决一件事情：**这个事情到底能不能完整跑起来？**

所以我们做了一个完整的 A2A Demo。企业可以建立自己的 Profile，Funding Provider 也可以建立自己的 Profile，然后系统可以做 Evidence Audit、Candidate Comparison、Match Explanation，以及整个 Agent Trace，最后还会留下 Human Handoff Record。

也就是说，从填写资料，到分析，到匹配，到最后由人决定是否继续沟通，整个闭环已经跑通。

这里 Demo 中看到的企业和基金都是虚构数据，匹配 Score 也是 deterministic demo score，不代表真实融资成功概率。

V0.1 的核心贡献就是：**我们证明了 Agent-to-Agent Funding Workflow 是可以真正运行起来的。**

## 第四页：V0.2——从“资金”升级到“资金 + 资源”

然后我们发现，融资其实远远不只是钱。

很多企业需要的可能是产业资源、客户、渠道、技术、供应链、政府资源、人才，甚至海外市场。

所以到了 V0.2，我们对整个 Funding Taxonomy 做了一次扩展。现在系统支持 **16 类 Capital Category、11 类 Company Stage，以及 8 种 Cohort Mode**。

同时我们加入了一个叫 **RSI 的相对 Benchmark 系统**。它允许用户自己定义 Cohort，然后比较不同企业或者 Funding Profile。

这个 RSI 不是一个绝对评分，它只是一个 configurable relative benchmark。

这一版本同时支持 Browser、CLI 和 TUI，Private RSI 数据保持在本地。

所以 V0.2 解决的问题是：**怎样把 Funding Matching 从简单配对，升级成一个可以分类、比较和研究的系统。**

## 第五页：三个版本，三个工程里程碑

如果把整个 Hackathon 的开发过程压缩成一句话，就是这一页。

**V0.1：Workflow。** 我们解决“怎么跑”。

**V0.2：Taxonomy + RSI。** 我们解决“怎么分类、怎么比较”。

**V0.3：Database + RAG。** 我们开始解决“这些数据和知识怎么长期保存、持续复用”。

所以这个项目其实不是三个完全不同的 Demo，而是一条连续的工程演化路线。每一个版本都保留前一个版本已经跑通的能力，然后再加一层新的 Infrastructure。

## 第六页：V0.3——真正的持久化数据库

V0.3 是这次比较重要的一次升级。

如果我们真的希望未来 Agent 可以不断工作，那么这些企业、Funding Provider、Funding Requirement、Match Result 和 Audit Record 就不能刷新一下网页全部消失。

所以我们加入了真正的 Backend Database。当前后端使用：**FastAPI + SQLAlchemy + SQLite**。

系统里目前有 12 张主要数据表，包括 Company、Founder、Funding Provider、Funding Requirement、Match Snapshot、Agent Run、Audit Record、Knowledge Record 等。

这些数据在网页刷新以后仍然存在，甚至 Backend Process Restart 以后也可以重新读取。

我们还专门做了 Restart Regression Test。在这个测试过程中，我们发现了一个 commit-after-response race condition，并且把它修掉了。

所以这里不是简单做了一张“像数据库的 UI”，它背后是真的有 persistence layer。

这意味着 Deep Funding 从 Demo 开始向真正可以长期运行的 Research Workspace 迈了一步。

## 第七页：Funding Knowledge / RAG

但是只有数据库还不够。Funding Agent 要真正工作，还必须“知道市场上有什么”。

所以我们另外建立了一个 Funding Knowledge Graph。目前里面有 **26 个 Funding Nodes**，其中包含 18 条带 Source 的机构或者项目记录，以及分类节点和模板。

这里有深圳 VC、PE / Growth Capital、Bank 等不同类型 Funding Provider 的资料。

我们采取一个很重要的原则：**不知道的东西，就保持 Unknown。**

比如某一家 VC 的历史投资方向可以从公开资料得到验证，但这并不代表它今天仍然有同样的 Investment Mandate。如果我们不知道它当前 Ticket Size，就不会让模型自己猜一个数字。

所以我们的 Knowledge Layer 会把机构身份、历史事实、当前资格、当前条款分开保存。

我们希望未来 Agent 给出的不是“看起来很聪明”的答案，而是一个可以追溯 Source Boundary 的答案。

## 第八页：Compliance RAG

同样的思路也应用在 Compliance 上。

Funding Matching 很容易涉及企业风险、新闻、诉讼、监管记录等信息，而这里最危险的一件事情就是：**把 allegation 当成 fact。**

所以在 Compliance Knowledge Graph 里面，我们把 Claim、Source、Company Response、Finding 全部分开保存。

例如一个媒体报道的争议事件，如果公司进行了否认，我们会同时保留报道和公司回应。它不会因为被 RAG 检索出来，就自动变成“这家公司违法”，更不会因此直接给一家无关企业降低评分。

Compliance Agent 的职责不是自动定罪，它应该做的是：**告诉人还有哪些问题需要进一步 Due Diligence，以及还应该索取哪些 Evidence。**

## 第九页：我们到底验证了什么？

截至 V0.3：

- **116 个 TypeScript Test**
- **19 个 Python Test**
- Public / Legacy Browser 12 组测试
- Private Runtime 5 组 Browser Test
- Production Worker 上 Public Test 可以通过

我们还做了一个本地 Transaction Microbenchmark。固定 Synthetic Pair 下，Median 大约是 **5.94 毫秒**，P95 大约 **6.64 毫秒**。

但这里我们不会说“Deep Funding 已经证明融资效率提升了多少”，因为这件事情我们还没有数据。

目前 Runtime LLM Call 也是 **0**。

我们现在验证的是：**这个系统是不是能稳定运行、数据是不是能保存、Workflow 是不是可复现。**

而真实 Matching Quality、Retrieval Precision，以及最终融资 Conversion Rate，目前都还是 **Unmeasured**。

这是下一阶段真正需要验证的问题。

## 第十页：下一步

Deep Funding V0.3 已经完成了一个比较完整的工程 Prototype。

现在已经有公开 Funding Knowledge Explorer、Fictional A2A Sandbox、Local Private Database，以及 RSI Research Workspace。

下一阶段，如果我们真正要进入 Private Pilot，还有几个 Gate：

1. Authentication 和 Tenant Isolation；
2. Database Migration、Backup 和 Recovery；
3. 持续更新并且有授权的数据源；
4. 真正建立 labelled retrieval benchmark；
5. 开始记录真实 Matching Outcome。

我们真正想验证的并不是：“AI 能不能自动帮一个企业融到钱。”

而是一个更实际的问题：

**在企业真正去见投资人之前，Deep Funding 能不能帮助双方得到一个更小、更准确、更有证据支持的 Candidate Shortlist，并且让第一次 Funding Conversation 更高质量？**

如果这件事情能够被验证，那么 Deep Funding 才真正从 Hackathon Prototype 走向一个有价值的 Funding Infrastructure。

这就是 Deep Funding V0.3。

谢谢大家。
