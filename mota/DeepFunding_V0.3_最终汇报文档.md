# DeepFunding V0.3 最终汇报

> 让资本与企业先由 Agent 相遇  
> 项目负责人：彭鹏一  
> 团队：Niu Lai Capital  
> 公开体验：https://pengyi-deep-funding.pengpengyi92.workers.dev/  
> 开源仓库：https://github.com/pengpengyi92/deep-funding  
> 汇报口径：已交付能力截至 V0.2；V0.3 为已完成设计、待按验收清单落地的下一版本

## 一、项目概述

DeepFunding 是一个面向创业者、企业与资金方的开源 Agent-to-Agent（A2A）融资匹配平台。项目把融资前置流程从零散搜索、重复填表和人工初筛，升级为结构化建档、约束过滤、双向匹配、结果解释、风险审计和反馈沉淀的 Agent 原生工作流。

企业端由 Company Agent 表达团队、产品、行业、阶段、融资金额、资金用途和资源需求；资金端由 Funding Agent 表达票面范围、投资阶段、行业、地域、成熟度要求、风险偏好与可提供资源。系统先以确定性规则过滤金额、阶段、地域与禁投项，再执行多维排序并生成可追溯解释。当匹配达到可行动水平时，人类再进入引荐、会面、材料补充、尽调与谈判。

项目坚持三个原则：关键约束由程序校验；模型输出必须可解释；系统辅助决策但不承诺融资结果，也不构成投资、信贷或法律建议。

## 二、问题与产品价值

| 参与方 | 原有问题 | DeepFunding 提供的价值 |
|---|---|---|
| 创业者/企业 | 找错资金类型、材料重复准备、缺少融资准备度判断 | 结构化 Profile、适合的资金类别、材料缺口、候选排序 |
| VC/PE/天使 | 项目资料不统一、阶段和票面错配、筛选成本高 | 硬约束过滤、可比较评分、证据与风险提示 |
| 银行/产业基金 | 更重视现金流、偿债、抵押、合规，不能套用 VC 逻辑 | 独立资金分类、差异化字段与匹配维度 |
| 双方 Agent | 缺少统一协议、数据接口与可复用反馈 | 共享 Schema、JSON/CLI/API 接口、运行与反馈记录 |

DeepFunding 不是静态投资人黄页，而是一套在人类正式接洽前运行的预融资协作基础设施。

## 三、版本演进

### V0：A2A 匹配纵向切片

V0 建立了可公开体验的完整最小闭环：

- 企业端与资金端双边建档；
- 硬约束过滤与 Top-K 多维匹配；
- 分项得分、匹配理由、风险与缺失材料；
- 反馈事件与下一步行动；
- Cloudflare Worker 公开部署；
- 合成演示数据与隐私边界。

匹配采用两阶段机制。第一阶段处理金额、阶段、地域、禁投项等不可妥协条件；第二阶段计算结构化适配与文本相关性：

```text
Score = 0.25 × StageFit
      + 0.20 × TicketFit
      + 0.20 × SectorFit
      + 0.15 × GeographyFit
      + 0.10 × ResourceFit
      + 0.10 × SemanticFit
```

权重位于配置层，可回归、可调试，不依赖提示词中的隐式判断。

### V0.2：RSI、Benchmark 与资本资源分类

V0.2 把一次性匹配扩展为可持续改进的选择智能：

- Founder RSI：按创业者自身需求和历史交互排序资金方；
- Funding RSI：将候选企业与机构私有历史组合进行比较；
- 八种 Cohort/Benchmark 模式与可解释组件分数；
- 深圳资金方知识库 Schema、JSONL 校验与合成样例；
- VC、PE、银行、孵化器、产业/政府基金等差异化分类；
- GUI、CLI、TUI 共用同一应用服务层；
- CLI `--json` 模式面向 Agent 与自动化调用；
- 私有 RSI 输入只在本地运行，浏览器隐私测试证明导入、运行和导出过程产生零网络请求。

V0.2 的工程验证包括 113 项单元/CLI/TUI 测试、9 组本地浏览器/API 测试及 9 组线上浏览器/API 测试；GitHub Branch CI 与 PR CI 均通过。公开部署保留原有数据库，无数据库迁移。

### V0.3：持久化数据与双 RAG Graph

V0.3 的目标是补齐 Agent 可长期使用的数据与知识基础设施。该版本已经完成实施规范，当前仍需按 Definition of Done 写入仓库并形成验证提交。

V0.3 由三个核心模块组成：

1. Persistent Backend Database；
2. Funding RAG Graph；
3. Compliance RAG Graph。

其核心公式是：

```text
私有用户数据
  + 公共资金知识
  + 公共合规知识
  + Agent 推理
  = DeepFunding V0.3
```

## 四、系统架构

```text
Web GUI / TUI / CLI / Agent API
                ↓
        Application Services
      ┌─────────┼─────────┐
      ↓         ↓         ↓
  Match/RSI  Funding RAG  Compliance RAG
      ↓         ↓         ↓
      Persistent Database + Public Knowledge
```

### 1. 交互与调用层

普通用户通过 Web GUI 完成建档、匹配、RSI 与知识检索；技术用户使用 TUI/CLI；Agent 通过 JSON/API 调用同一服务层。业务逻辑不复制到各个 UI 中。

### 2. Agent 层

| Agent | 职责 | 输出 |
|---|---|---|
| Information Agent | 收集、清洗和标准化主体资料 | Company/Funding Profile |
| Analysis Agent | 评估成熟度、准备度和适合的资金类别 | 优势、缺口、建议 |
| Audit Agent | 检查完整性、一致性、证据与合规模式 | 警告、证据请求、置信度 |
| Match Agent | 综合硬约束、Funding Fit 与 Risk Context | 排名、解释、行动建议 |

### 3. V0.3 后端数据层

V0.3 采用 Python 3.11+、FastAPI、SQLAlchemy 2.x、Pydantic、Uvicorn 与 SQLite。SQLite 提供真实持久化、零外部数据库依赖和单文件部署；业务层不与 SQLite 紧耦合，以便后续迁移 PostgreSQL、Supabase 或 Cloud SQL。

核心模型包括：`User`、`FounderProfile`、`CompanyProfile`、`CompanyFundingNeed`、`FundingProviderProfile`、`FundingPreference`、`Match`、`AgentRun`、`AuditRecord`、`Subscription`、`KnowledgeEntity` 与 `ComplianceCase`。

关键设计是将机构身份与匹配策略分离、将 Match 和 AgentRun 持久化，并允许早期企业的财务字段为空。这样既支持可审计的历史运行，也不会用成熟企业的数据要求错误排除 Pre-seed 项目。

## 五、V0.3 双知识图谱设计

### 1. Funding RAG Graph

Funding RAG Graph 使用 Markdown、YAML Front Matter 和轻量索引实现，不在黑客松阶段过度引入图数据库。它覆盖深圳相关的：

- VC 与 PE；
- 银行与 Venture Debt；
- 产业基金与政府基金；
- 孵化器与加速器；
- 天使、战略投资者、Corporate VC 与 Family Office；
- Grant 与大学基金。

每个实体记录阶段、行业、地域、票面、可提供资源、来源链接、最近核验时间和核验状态。不得编造 AUM、票面或投资偏好；无法核实的字段保持为空或标记 `needs_review`。

### 2. Compliance RAG Graph

Compliance RAG Graph 是用于融资、贷款、尽调、并购及上市准备的风险学习库，不是企业黑名单。其范围包括劳动用工、公司治理、财务报告、数据隐私、反腐败、AML/KYC、制裁、监管行动、上市披露与正向 Benchmark。

每个案例必须分离：确认事实、监管认定、公司声明、媒体报道、指控、争议性主张和分析。Agent 只能输出“需要复核”和证据请求，不能把模式相似或媒体报道自动转换为违法结论。

## 六、数据安全与责任边界

| 数据类型 | 默认处理方式 |
|---|---|
| Funding/Compliance 公共知识 | 可进入公开仓库，但必须保存来源和核验状态 |
| 合成演示数据 | 可公开，用于测试行为而非证明商业效果 |
| Founder/Company 提交 | 私有数据库，不提交到公共仓库 |
| 资金方私有偏好与历史组合 | 本地/私有保存，远程调用需显式授权 |
| Match 与 Agent trace | 可能包含私有输入，按权限存储和访问 |
| API Key/Secret | 不进入数据库或仓库 |

系统输出表示适配分析与风险提示，不代表投资意见、授信审批、法律结论或融资承诺。

## 七、验证与证据

### 已验证的 V0/V0.2

| 项目 | 证据 |
|---|---|
| 公开部署 | `pengyi-deep-funding.pengpengyi92.workers.dev` |
| 实现合并 | PR #5，merge commit `3b071a1` |
| V0.2 实现提交 | `45d79ea` |
| 单元/CLI/TUI | 113 项测试 |
| 浏览器/API | 本地 9 组 + 线上 9 组 |
| 隐私测试 | RSI 导入/运行/导出零网络请求 |
| CI | Branch CI 与 PR CI 通过 |

这些证据证明软件行为、部署可用性和基础工程质量，不证明真实融资成功率、投资回报或跨类别评分已完成商业校准。

### V0.3 Definition of Done

V0.3 只有在以下验收全部满足后，才能对外标记为已完成：

- 企业与资金方资料可以提交并写入真实数据库；
- Agent 可以读取持久化记录并生成 A2A Match；
- Match 与 AgentRun 被保存，刷新浏览器及重启后数据仍存在；
- Data Explorer 可在权限范围内查看记录、搜索、筛选与计数；
- Funding 与 Compliance RAG Graph 均可被 Agent 检索；
- 资金实体均含来源和核验状态；
- 合规案例不会把争议性媒体信息当作确认违法；
- 数据库、CRUD、持久化、RAG 解析/过滤和证据等级测试全部通过；
- README 与 CHANGELOG 明确标记 `v0.3.0`；
- 形成可复核的实现 commit、CI 和线上演示证据。

## 八、项目创新与开源价值

1. 双边 A2A：企业和资金方都拥有表达信息与偏好的 Agent，而非单向推荐。
2. 规则与模型分工：关键约束可复现，语义能力服务于理解和解释。
3. RSI 与递归 Benchmark：双方可以从自身历史中形成持续更新的选择智能。
4. 资本资源分类：银行、VC、PE、产业基金与孵化器使用不同的匹配逻辑。
5. Funding + Compliance 双检索：资金适配与风险语境共同进入最终建议。
6. 本地优先：开源引擎和公共知识可共享，专有数据保持专有。
7. 可贡献边界：社区可新增实体、来源、Schema 校验、Cohort、测试和检索器。

## 九、下一阶段

近期工作首先是完成 V0.3 P0：SQLite/SQLAlchemy 数据模型、FastAPI CRUD、持久化 Match/AgentRun、Database Explorer、两个 RAG Graph、轻量检索、Seed 与测试。随后再推进订阅 Gate、来源核验工具和资金方 Onboarding。

PostgreSQL、多租户认证、向量数据库、图数据库、自动数据采集、支付系统、自动外联和完整尽调编排属于后续版本，不是 V0.3 完成条件。

## 十、总结

DeepFunding 已经从 A2A 融资匹配原型发展为具备公开部署、RSI、Benchmark、资本资源分类、GUI/CLI/TUI 和严格隐私边界的开源产品。V0.3 进一步把产品的下一阶段明确为“持久化私有数据 + 可追溯公共知识 + Agent 推理”，为真正可持续运行的融资协作网络建立数据底座。

资本与企业最终仍由人作出决定；DeepFunding 的价值，是让双方在见面之前先以更完整的信息、更清晰的约束和更可解释的证据相遇。

---

## 附录：一分钟汇报稿

DeepFunding 是 Niu Lai Capital 开发的开源 Agent-to-Agent 融资匹配平台。我们不是做一个投资人黄页，而是让企业 Agent 与资金方 Agent 在人类会面前完成结构化建档、硬约束过滤、双向排序、解释和风险审计。V0 已打通公开匹配闭环；V0.2 增加 Founder/Funding RSI、八种 Benchmark、深圳资本资源分类、GUI/CLI/TUI 和本地隐私工作区，并完成 113 项测试及本地、线上各 9 组浏览器/API 验证。V0.3 的最终方案由持久化数据库、Funding RAG Graph 和 Compliance RAG Graph 组成，把私有用户数据、公共资金知识、公共合规知识与 Agent 推理连接起来。我们希望把融资前期筛选变成一个可解释、可审计、可评测、可持续改进的开放基础设施。
