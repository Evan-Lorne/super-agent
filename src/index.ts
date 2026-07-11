import 'dotenv/config';
import { type ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createInterface } from 'node:readline';
import { createMockModel } from './mock-model.js';
import { ToolRegistry } from './tools/registry.js';
import { allTools } from './tools';
import { agentLoop, type BudgetState } from './agent/loop';

const openai = createOpenAI({
  baseURL: process.env.OPEN_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

// const model = openai.chat('gpt-5.5')
const model = createMockModel();

const registry = new ToolRegistry();
registry.register(...allTools);

console.log(`已注册 ${registry.getAll().length} 个工具：`);
for (const tool of registry.getAll()) {
  const flags = [
    tool.isConcurrencySafe ? '可并发' : '串行',
    tool.isReadOnly ? '只读' : '读写',
  ].join(', ');
  console.log(`  - ${tool.name}（${flags}）`);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const messages: ModelMessage[] = [];
// const budget: BudgetState = { used: 0, limit: 15000 };

const SYSTEM = `你是 Super Agent，一个能搜索互联网、读写代码的 AI 助手。

你有 web_search 和 web_fetch 两个搜索相关的工具：
- web_search：搜索互联网，返回相关网页的标题、链接和内容摘要
- web_fetch：抓取指定 URL 的完整内容，转为 Markdown

当用户问的问题需要最新信息时，先用 web_search 搜索，拿到结果后总结回答。
如果搜索结果的摘要不够详细，用 web_fetch 抓取具体链接的全文。

回答简洁直接，引用信息时标注来源链接。`;

function ask() {
  rl.question('\nYou: ', async (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'exit') {
      console.log('Bye!');
      rl.close();
      return;
    }

    messages.push({ role: 'user', content: trimmed });

    await agentLoop(model, registry, messages, SYSTEM);

    ask();
  });
}

console.log('Super Agent v0.3 — Fuses (type "exit" to quit)\n');
console.log('试试输入："测试死循环"、"测试重试"、"测试预算" 看三层防护效果\n');
ask();