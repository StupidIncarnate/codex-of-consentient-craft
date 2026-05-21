import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { taskPromptIdsExtractorTransformer } from './task-prompt-ids-extractor-transformer';

const buildLine = ({ content }: { content: unknown }): unknown =>
  snakeKeysToCamelKeysTransformer({
    value: { type: 'user', message: { role: 'user', content } },
  });

const TASK_PROMPT = `Call mcp__dungeonmaster__get-agent-prompt({
  agent: "pathseeker-surface",
  workItemId: "875c3364-2d64-4606-b9e3-25dd365c7792",
  questId: "6e8fdc8b-4fb4-4536-bd99-b43b20764932"
}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({
  questId: "6e8fdc8b-4fb4-4536-bd99-b43b20764932",
  workItemId: "875c3364-2d64-4606-b9e3-25dd365c7792",
  signal: "complete" | "failed",
  summary: "<one-line>"
}).`;

describe('taskPromptIdsExtractorTransformer', () => {
  describe('valid extraction', () => {
    it('VALID: {user line with string content embedding both ids} => returns {questId, workItemId}', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({ content: TASK_PROMPT }),
      });

      expect(result).toStrictEqual({
        questId: '6e8fdc8b-4fb4-4536-bd99-b43b20764932',
        workItemId: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
    });

    it('VALID: {user line with content array containing text item} => returns {questId, workItemId}', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({ content: [{ type: 'text', text: TASK_PROMPT }] }),
      });

      expect(result).toStrictEqual({
        questId: '6e8fdc8b-4fb4-4536-bd99-b43b20764932',
        workItemId: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
    });
  });

  describe('no extraction', () => {
    it('EMPTY: {non-user line (assistant)} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: { type: 'assistant', message: { content: TASK_PROMPT } },
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {user line without ids in content} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({ content: 'no ids here, just chatter' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {only workItemId present, no questId} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({
          content: 'workItemId: "875c3364-2d64-4606-b9e3-25dd365c7792" and that is all',
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {only questId present, no workItemId} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({
          content: 'questId: "6e8fdc8b-4fb4-4536-bd99-b43b20764932" alone',
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {ids present but not valid UUIDs} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({
          content: 'workItemId: "not-a-uuid" questId: "also-not-a-uuid"',
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {content array has no text items} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({
        parsed: buildLine({ content: [{ type: 'tool_result', toolUseId: 'tu_1' }] }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed null} => returns null', () => {
      const result = taskPromptIdsExtractorTransformer({ parsed: null });

      expect(result).toBe(null);
    });
  });
});
