# 魔搭部署口径与当前状态

Timestamp: 2026-09-06T13:48:00+08:00

## 当前事实

- Cloudflare V0.3 已运行，视频已发布：
  https://pengyi-deep-funding.pengpengyi92.workers.dev/watch.html
- 魔搭尚未部署。本机未配置 ModelScope API Token；浏览器登录框的
  passport.modelscope.cn 子页面连接失败；尚无已核验的 Studio owner/repo。
- 已准备 `mota/studio/` Docker 发布适配层和公共资产打包脚本。
  魔搭托管静态前端，API 仍使用现有 Cloudflare 公共演示后端。
  这不是迁移 SQLite，也不是独立魔搭后端。
- Windows Docker Linux daemon 当前未运行。容器验证交给单独 Linux CI，
  其结果需要读取，不能把配置文件存在当作运行成功。

## 历史文档校准

保留本目录原始 MD/Word 作为历史材料，以下口径以代码与验证为准：

1. `DeepFunding_魔搭作品介绍与技术说明.md` 中把 Cloudflare URL 写成魔搭
   创空间，属于未验证描述；不能对外声称魔搭已上线。
2. 公开后端是 Worker + D1 虚构数据沙盒。本地私有研究是 FastAPI、
   SQLAlchemy、SQLite。二者不能混写。
3. V0.3 已有 12 表本地持久化、40 个资金/合规知识节点；原“尚在设计”
   的版本说明已经过时。
4. 当前检索为关键词/元数据方法，Agent 为确定性服务；
   不宣称向量库、在线 LLM、自主外联、生产私有多租户系统。
5. 排名必须按当前 matching/RSI 引擎说明；历史写作中的示意权重
   不能冒充代码实现或已校准的商业指标。

## 演示材料

英文与中文各 10 页，存放在 PPPT 私有仓库：

- `exports/PPPT_Deep_Funding_v0.3_Overview_10slides.pptx`
- `exports/PPPT_Deep_Funding_v0.3_Overview_ZH_10slides.pptx`

公共演示视频为 28 秒、1080p30，保留原始本机母版；
网页版本约 17.89 MB，支持拖动进度和完整画面。

## 下一步

完成魔搭登录，核验账户及既有创空间，选择已返回的免费资源，
确认 Docker 的账号绑定/实名条件，推送公共部署包并部署。
不得上传本地数据库、工作区隐私资料或密钥，不自动开通付费资源。
部署后记录实际 URL、版本、日志与浏览器工作流验证。
