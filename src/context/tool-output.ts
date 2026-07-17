type TaggedToolOutput = {
  type?: unknown;
  value?: unknown;
  reason?: unknown;
};

function stringify(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
}

export function toolOutputToText(output: unknown): string {
  if (typeof output === 'string') return output;
  if (!output || typeof output !== 'object') return stringify(output);

  const tagged = output as TaggedToolOutput;
  switch (tagged.type) {
    case 'text':
    case 'error-text':
      return typeof tagged.value === 'string' ? tagged.value : stringify(tagged.value);
    case 'json':
    case 'error-json':
      return stringify(tagged.value);
    case 'execution-denied':
      return typeof tagged.reason === 'string' ? tagged.reason : 'execution denied';
    case 'content':
      return Array.isArray(tagged.value)
        ? tagged.value.map(part => {
            if (part && typeof part === 'object' && (part as { type?: unknown }).type === 'text') {
              return String((part as { text?: unknown }).text ?? '');
            }
            return stringify(part);
          }).join('\n')
        : stringify(tagged.value);
    default:
      return stringify(output);
  }
}

export function isToolOutputError(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false;
  const type = (output as TaggedToolOutput).type;
  return type === 'error-text' || type === 'error-json' || type === 'execution-denied';
}

export function replaceToolOutputText(output: unknown, text: string): unknown {
  if (typeof output === 'string') return text;
  if (!output || typeof output !== 'object') return output;

  const tagged = output as TaggedToolOutput;
  switch (tagged.type) {
    case 'text':
    case 'json':
    case 'error-text':
    case 'error-json':
      return { ...output, value: text };
    case 'content':
      return { ...output, value: [{ type: 'text', text }] };
    case 'execution-denied':
      return { ...output, reason: text };
    default:
      return output;
  }
}
