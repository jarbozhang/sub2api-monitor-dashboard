---
title: Sub2API Token 消耗监控排行榜
status: completed
created: 2026-05-28
updated: 2026-05-28
origin: user request
---

# Sub2API Token 消耗监控排行榜计划

## 目标

做一个全新的 Next.js + React 网页应用，用于在监控大屏上持续展示 Sub2API 管理账号下的 token 消耗排行榜。页面默认无人值守运行，核心体验是“打开后持续看”，不是频繁点击查询。

首版只做一个酷炫、稳定、信息密度合适的排行榜：

- 全局维度支持今日、近 7 天、近 30 天。
- 每行展示排名、用户名、token 总量、请求数、当天或当前周期的小趋势图。
- 不展示用户邮箱。
- 不展示费用。
- 行右侧使用小型波浪线图表展示活跃趋势，今日按 1 小时间隔，7 天和 30 天按天聚合。
- 页面自动刷新、自动更新动画、可选自动轮播周期，尽量不依赖鼠标操作。

## 已确认的 Sub2API 接口事实

调研当前 Sub2API 源码和已部署实例后，计划按 Admin API Key 接入，而不是在页面运行时登录。

- 管理路由支持 `x-api-key: <admin-api-key>` 认证。
- 管理设置路由包含 Admin API Key 的查看、重新生成和删除能力：
  - `GET /api/v1/admin/settings/admin-api-key`
  - `POST /api/v1/admin/settings/admin-api-key/regenerate`
  - `DELETE /api/v1/admin/settings/admin-api-key`
- 当前实例 `GET /api/v1/admin/settings/admin-api-key` 返回 `exists: false`，说明还没有生成永久 key。
- 需要先在 Sub2API 管理端生成一次 Admin API Key，再把 key 写入新应用的 `.env.local`。
- 排行榜数据使用：
  - `GET /api/v1/admin/dashboard/users-ranking`
  - `GET /api/v1/admin/dashboard/users-trend`
- `users-ranking` 适合作为排序和汇总来源，返回结构为 `data.ranking`，每行包含 `user_id`、`email`、`requests`、`tokens`、`actual_cost` 等字段。
- `users-trend` 适合作为趋势来源，返回结构为 `data.trend`，每行包含 `date`、`user_id`、`email`、`username`、`requests`、`tokens` 等字段。
- 因为排行榜接口本身不稳定提供 `username`，新应用的 BFF 层需要按 `user_id` 合并 `users-ranking` 和 `users-trend`：排序用 ranking，展示名优先用 trend 的 `username`，缺失时显示 `用户 #<短 user_id>`，不要退回展示邮箱。
- 已通过生成的 Admin API Key 验证：直接使用 `x-api-key` 可以访问 `users-ranking` 和 `users-trend`，不依赖登录态。

## 产品范围

### 包含

- 一个监控大屏首页。
- 一个服务端 API 聚合层，统一调用 Sub2API 管理接口。
- 今日、近 7 天、近 30 天三个时间窗口。
- Top N 排行，默认展示前 20 名。
- 用户数超过展示容量时支持自动分页或滚动翻页。
- 每行右侧展示小趋势图。
- 自动刷新、刷新状态、最近更新时间、失败保留旧数据。
- 大屏动效：排名变动、数字滚动、趋势线绘制、行高亮、周期切换过渡。

### 不包含

- 多页面后台系统。
- 应用内登录系统。
- 成本/费用展示。
- 用户邮箱展示。
- CSV 导出。
- 告警规则。
- 多 Sub2API 实例聚合。
- 对 Sub2API 的写操作。生成 Admin API Key 是一次性运维动作，不在这个监控页面里做。

## 大屏交互设计

页面应该像监控屏，而不是后台表格。

- 默认全屏信息布局，进入首页即展示排行榜。
- 顶部只放必要状态：当前周期、总 token、总请求数、活跃用户数、最近更新时间、刷新状态。
- 周期切换默认自动轮播：今日、近 7 天、近 30 天循环展示。
- 仍保留键盘或 URL 参数固定周期的能力，方便调试和临时展示，但不把点击作为主要使用路径。
- 排行榜主体占据首屏大部分空间，行高稳定，远距离也能读清排名和 token 数。
- 每行最右侧固定宽度展示 sparkline，避免刷新时布局抖动。
- 数据刷新时旧数据继续显示，新数据到达后做平滑过渡。

## 动效原则

动效服务于“看懂变化”，不做会干扰监控的装饰。

- 排名变化：行位置平滑移动，升降名次用短暂的颜色和箭头提示。
- 新进入榜单：从低透明度淡入，并短暂高亮。
- 掉出当前页：淡出后移除。
- 数字变化：token 和请求数使用 count-up/count-down，持续 600 到 900ms。
- 趋势线：刷新后从左到右重绘，强度随 token 使用量变化。
- 当前第一名可以有轻量光效，但不要影响可读性。
- 自动分页或周期轮播时使用横向或纵向平滑过渡，避免瞬间跳屏。
- 尊重 `prefers-reduced-motion`，系统要求减少动效时只保留淡入淡出。

## 定时刷新规则

默认规则需要明确、可配置，并避免并发请求堆积。

- 首次打开页面立即请求一次数据。
- 数据刷新间隔默认 60 秒，通过 `LEADERBOARD_REFRESH_SECONDS` 配置。
- 周期自动轮播默认 20 秒，通过 `LEADERBOARD_PERIOD_ROTATE_SECONDS` 配置。
- 数据刷新和周期轮播相互独立：轮播只切换当前展示窗口，刷新负责拉取最新数据。
- 每次刷新都重新计算时间范围，使用 `SUB2API_TIMEZONE`，默认 `Asia/Shanghai`。
- 今日窗口：当天 00:00:00 到当前时间。
- 近 7 天窗口：包含今天在内的最近 7 个自然日。
- 近 30 天窗口：包含今天在内的最近 30 个自然日。
- 如果刷新开始时上一轮请求还没结束，跳过本次刷新，不并发叠加。
- 请求成功后整体替换快照，并触排行和数字动画。
- 请求失败时保留上一份成功快照，顶部显示失败状态和失败次数，下一轮按正常间隔重试。
- 连续失败 3 次后降低刷新状态的视觉强度，但不要清空排行榜。
- 页面不可见时可以降低刷新频率到 5 分钟；重新可见后立即刷新一次。
- 自动分页只在当前周期数据超过可见行数时启用，默认每 12 秒翻一页。

## 数据模型

服务端聚合后返回前端一个适合直接渲染的稳定结构：

```ts
type LeaderboardPeriod = "today" | "week" | "month";

type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  requests: number;
  trend: Array<{
    bucket: string;
    tokens: number;
    requests: number;
  }>;
  rankDelta?: number;
};

type LeaderboardSnapshot = {
  period: LeaderboardPeriod;
  generatedAt: string;
  timezone: string;
  totals: {
    tokens: number;
    requests: number;
    activeUsers: number;
  };
  rows: LeaderboardRow[];
};
```

`displayName` 的规则：

1. 优先使用 Sub2API trend 数据里的 `username`。
2. 如果 `username` 为空，显示 `用户 #<userId 前 6 位>`。
3. 不使用邮箱作为展示兜底。

## 技术方案

### 框架

- Next.js App Router。
- React Client Component 负责动画和定时刷新。
- Route Handler 负责服务端聚合和密钥保护。
- TypeScript。
- Tailwind CSS 或项目内轻量 CSS 变量。
- 图表使用轻量 SVG sparkline，不引入重型图表库。

Context7 查阅的 Next.js 文档确认：App Router 的 Route Handler 可以用标准 `GET(request: Request)` 处理 API；服务端代码可通过 `process.env` 读取环境变量；频繁变化数据应使用 `fetch(..., { cache: "no-store" })` 或等价方式避免缓存。

### 目录规划

```text
app/
  page.tsx
  api/
    leaderboard/
      route.ts
  globals.css
components/
  leaderboard/
    LeaderboardScreen.tsx
    LeaderboardRow.tsx
    MetricHeader.tsx
    PeriodTicker.tsx
    Sparkline.tsx
lib/
  sub2api/
    client.ts
    leaderboard.ts
    time-windows.ts
  formatting.ts
  env.ts
types/
  leaderboard.ts
docs/
  plans/
    sub2api-token-leaderboard.md
    sub2api-token-leaderboard.html
```

### 服务端 API

`app/api/leaderboard/route.ts` 接收：

- `period=today|week|month`
- `limit=20`

Route Handler 行为：

- 从 `process.env.SUB2API_BASE_URL` 读取 Sub2API 地址。
- 从 `process.env.SUB2API_ADMIN_API_KEY` 读取永久 Admin API Key。
- 调用 Sub2API 时加 `x-api-key` header。
- 使用 `cache: "no-store"`。
- 根据 period 计算 `start_date`、`end_date`、`granularity`。
- 并行请求 `users-ranking` 和 `users-trend`。
- 在服务端合并用户名、排行汇总和趋势点。
- 返回前端需要的 `LeaderboardSnapshot`。
- 不把 Admin API Key 返回给浏览器。

### 环境变量

```env
SUB2API_BASE_URL=http://100.102.206.124:18080
SUB2API_ADMIN_API_KEY=
SUB2API_TIMEZONE=Asia/Shanghai
LEADERBOARD_REFRESH_SECONDS=60
LEADERBOARD_PERIOD_ROTATE_SECONDS=20
LEADERBOARD_AUTO_ROTATE=true
LEADERBOARD_DEFAULT_PERIOD=today
LEADERBOARD_PAGE_SECONDS=12
```

首版不需要 `SUB2API_ADMIN_EMAIL` 和 `SUB2API_ADMIN_PASSWORD`。如果没有 Admin API Key，先到 Sub2API 管理端生成，而不是让监控页面登录。

## 实施单元

### 1. 初始化全新 Next.js 项目

文件：

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

工作：

- 清理旧部署项目文件，仅保留 `docs/`。
- 初始化 Next.js + React + TypeScript。
- 建立全屏监控页面基础布局。
- 添加 `.env.example`，只包含本应用需要的配置。

测试：

- `npm run lint`
- `npm run typecheck`
- 首页能启动并显示空数据状态。

### 2. Sub2API 服务端客户端

文件：

- `lib/env.ts`
- `lib/sub2api/client.ts`
- `lib/sub2api/time-windows.ts`
- `lib/sub2api/leaderboard.ts`
- `types/leaderboard.ts`

工作：

- 校验必要环境变量。
- 封装 `x-api-key` 请求。
- 实现今日、近 7 天、近 30 天时间窗口。
- 实现 ranking + trend 合并。
- 明确用户名兜底规则，禁止邮箱进入前端展示字段。

测试：

- 单测覆盖时间窗口。
- 单测覆盖 username 缺失时的 `用户 #xxxxxx` 兜底。
- 单测覆盖 ranking 中有 email 但输出不含 email。
- 单测覆盖 Sub2API 请求失败时返回可识别错误。

### 3. Next.js 聚合 API

文件：

- `app/api/leaderboard/route.ts`
- `lib/sub2api/leaderboard.ts`

工作：

- 暴露 `GET /api/leaderboard`。
- 支持 period 和 limit 参数。
- 使用 `no-store`。
- 返回统一快照。
- 错误时返回结构化错误，前端可保留旧数据。

测试：

- period 非法时返回 400。
- key 缺失时返回服务端配置错误。
- Sub2API 认证失败时返回 502 或 503，不泄露 key。
- 成功时返回 rows、totals、generatedAt。

### 4. 大屏排行榜 UI

文件：

- `components/leaderboard/LeaderboardScreen.tsx`
- `components/leaderboard/LeaderboardRow.tsx`
- `components/leaderboard/MetricHeader.tsx`
- `components/leaderboard/PeriodTicker.tsx`
- `components/leaderboard/Sparkline.tsx`
- `app/page.tsx`
- `app/globals.css`

工作：

- 构建大屏首屏布局。
- 渲染排名、用户名、token、请求数、趋势线。
- 不渲染邮箱和费用。
- 数字格式化适合远距离观看。
- 支持空数据、加载中、刷新失败但保留旧数据。

测试：

- 组件测试确认行内没有 cost 字段。
- 组件测试确认行内没有 email 字段。
- 组件测试确认 sparkline 点数符合 period。
- 浏览器截图检查 1440x900 和 1920x1080 视口。

### 5. 自动刷新、轮播和动画

文件：

- `components/leaderboard/LeaderboardScreen.tsx`
- `components/leaderboard/LeaderboardRow.tsx`
- `components/leaderboard/PeriodTicker.tsx`
- `app/globals.css`

工作：

- 首次加载立即刷新。
- 60 秒数据刷新。
- 20 秒周期自动轮播。
- 超出可见行数时自动分页。
- 防止并发请求。
- 排名、数字、趋势线和页面切换动画。
- 支持 `prefers-reduced-motion`。

测试：

- fake timers 覆盖刷新间隔。
- fake timers 覆盖周期轮播。
- 请求未结束时不会再次发起请求。
- 刷新失败时旧 rows 仍保留。

## 验收标准

- 打开首页无需点击即可看到排行榜。
- 页面默认自动在今日、近 7 天、近 30 天之间轮播。
- 数据默认每 60 秒刷新一次。
- 每行只显示排名、用户名、token、请求数和趋势图。
- 页面任何位置都不展示用户邮箱。
- 页面任何位置都不展示费用。
- Admin API Key 只存在服务端环境变量中，不进入浏览器 bundle 或接口响应。
- 今日趋势按小时展示，7 天和 30 天趋势按天展示。
- 超过可见行数时自动分页或自动滚动，不需要鼠标操作。
- Sub2API 短暂不可用时保留最后一次成功数据。

## 风险与处理

- `users-ranking` 不直接返回 username：通过 `users-trend` 合并，缺失时显示匿名用户编号。
- 当前实例还没有 Admin API Key：上线前需要在 Sub2API 管理端生成一次，并写入 `.env.local`。
- 监控屏长时间运行可能内存增长：避免无限保存历史快照，只保留当前和上一份快照用于动画对比。
- 数据刷新和动画可能互相干扰：刷新只替换快照，动画由 React 状态对比驱动，不在定时器里直接操作 DOM。
- 小项目容易过度设计：首版不引入数据库、不做登录、不做复杂权限、不做重型图表平台。

## 后续可选

- 增加“最近 24 小时滚动窗口”，和“今日自然日”并列。
- 增加模型维度或 API key 维度排行榜。
- 增加异常峰值闪烁提示。
- 增加只读分享页面。
- 增加部署脚本和健康检查。
