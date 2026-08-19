/**
 * PURPOSE: Answers what a tool result should LOOK like, before anything renders it. A JSON reply
 * whose properties hold whole documents arrives with those documents escaped — every newline
 * printed as the two characters `\` and `n` — which no amount of panel width makes readable, so
 * this resolves such a reply into one unit per property and marks the units that were written as
 * markdown. It declines on everything else, which is the load-bearing half: build logs, diffs, file
 * bodies and one-line answers keep the verbatim render they already had, and only a result that
 * genuinely cannot be read as-is costs the caller a second branch.
 *
 * USAGE:
 * parseToolResultDisplayTransformer({content: '{"model":"sonnet","prompt":"# Operator\\n\\nYou own…"}'});
 * // Returns [{kind: 'text', label: 'model', …}, {kind: 'markdown', label: 'prompt', …}]
 */

import { parsedToolResultContract } from '../../contracts/parsed-tool-result/parsed-tool-result-contract';
import { toolResultPartContract } from '../../contracts/tool-result-part/tool-result-part-contract';
import type { ToolResultPart } from '../../contracts/tool-result-part/tool-result-part-contract';
import { isMarkdownContentGuard } from '../../guards/is-markdown-content/is-markdown-content-guard';

export const parseToolResultDisplayTransformer = ({
  content,
}: {
  content: string;
}): ToolResultPart[] | null => {
  const rawParsed = ((): unknown => {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      return undefined;
    }
  })();

  if (typeof rawParsed !== 'object' || rawParsed === null || Array.isArray(rawParsed)) {
    if (!isMarkdownContentGuard({ content })) {
      return null;
    }

    return [toolResultPartContract.parse({ kind: 'markdown', source: content })];
  }

  const parsedResult = parsedToolResultContract.safeParse(rawParsed);
  if (!parsedResult.success) {
    return null;
  }
  const parsed = parsedResult.data;

  const fields = Object.keys(parsed).map((key) => {
    const rawValue = parsed[key as keyof typeof parsed];

    return {
      key,
      // Nested objects and arrays serialise back to a single line, so they never trip the
      // multi-line test below — a reply is only restructured for the escaped documents inside it.
      value: typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue),
    };
  });

  if (!fields.some((field) => field.value.includes('\n'))) {
    return null;
  }

  return fields.map((field) =>
    toolResultPartContract.parse(
      isMarkdownContentGuard({ content: field.value })
        ? { kind: 'markdown', label: field.key, source: field.value }
        : { kind: 'text', label: field.key, text: field.value },
    ),
  );
};
