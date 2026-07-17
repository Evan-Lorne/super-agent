# Super Agent

一个用于学习 AI Agent 工具调用机制的 TypeScript 命令行项目。它通过 AI SDK 驱动 Agent 循环，提供工具注册、并发控制、调用循环检测、重试和结果截断等基础能力。默认使用本地 mock 模型，方便演示和调试。

## 运行

```bash
pnpm install
pnpm start
```

退出交互程序时输入 `exit`。如需接入 OpenAI 兼容服务，在本地 `.env` 中配置 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY`，然后在 `src/index.ts` 中启用对应模型。请勿提交 `.env` 文件。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `src/index.ts` | 命令行入口：加载环境变量、创建模型和工具注册表，并维护用户交互对话。 |
| `src/mock-model.ts` | 模拟语言模型：根据内置演示场景发起工具调用或返回示例回答，无需真实 API。 |
| `src/retry.ts` | 判断可重试错误，并提供带随机抖动的指数退避和延迟函数。 |
| `src/agent/loop.ts` | Agent 主执行循环：流式输出、工具调用、重试、循环防护和 Token 预算控制。 |
| `src/tools/index.ts` | 定义并汇总当前通过注册表暴露的天气、计算、文件读写和目录浏览工具。 |
| `src/tools/registry.ts` | 工具注册表：将工具适配为 AI SDK 格式，并通过读写锁控制并发和截断结果。 |
| `src/tools/detection.ts` | 记录工具调用历史，检测重复调用、乒乓循环和无进展状态。 |
| `src/tools/utility-tools.ts` | 早期的独立天气和计算工具示例；当前入口未使用，保留作参考。 |
| `sample-data.txt` | 工具系统设计与结果截断、并发控制等概念的示例资料。 |
| `package.json` | 项目元数据、依赖清单和开发/启动脚本。 |
| `pnpm-lock.yaml` | pnpm 生成的精确依赖版本锁定文件，确保可复现安装。 |
| `tsconfig.json` | TypeScript 编译选项与源码目录配置。 |
| `.gitignore` | 排除本地依赖、构建输出、环境变量和日志，避免上传凭据与无关产物。 |
| `README.md` | 项目概述、运行方式和本文件职责说明。 |

## 设计要点

- 只读工具可并行执行，写入工具获得独占锁。
- 工具结果按头部 60% 和尾部 40% 截断，减少上下文占用。
- 循环检测会识别重复调用、交替调用和持续无进展的情况。
- 对临时网络和服务端错误使用指数退避重试。
