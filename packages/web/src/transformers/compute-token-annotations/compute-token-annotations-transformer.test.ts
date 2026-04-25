import { computeTokenAnnotationsTransformer } from './compute-token-annotations-transformer';
import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolUseChatEntryStub,
  AssistantToolResultChatEntryStub,
  TaskNotificationChatEntryStub,
  SystemErrorChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import {
  MergedEntryItemStub,
  MergedToolPairItemStub,
} from '../../contracts/merged-chat-item/merged-chat-item.stub';
import { TokenAnnotationStub } from '../../contracts/token-annotation/token-annotation.stub';
import { FormattedTokenLabelStub } from '../../contracts/formatted-token-label/formatted-token-label.stub';
import { ContextTokenCountStub } from '../../contracts/context-token-count/context-token-count.stub';
import { ContextTokenDeltaStub } from '../../contracts/context-token-delta/context-token-delta.stub';

describe('computeTokenAnnotationsTransformer', () => {
  describe('entries without usage', () => {
    it('VALID: {items: [user entry]} => returns annotation with all nulls', () => {
      const items = [MergedEntryItemStub({ entry: UserChatEntryStub() })];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });

    it('VALID: {items: [assistant text, no usage]} => returns annotation with all nulls', () => {
      const items = [MergedEntryItemStub({ entry: AssistantTextChatEntryStub() })];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });
  });

  describe('entries with usage', () => {
    it('VALID: {items: [first assistant text with usage]} => no badge (no prev to diff against), captures cumulative', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
      ]);
    });

    it('VALID: {items: [two assistant texts with usage]} => second shows +delta badge', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: FormattedTokenLabelStub({ value: '+700 context' }),
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: ContextTokenDeltaStub({ value: 700 }),
          source: 'session',
        }),
      ]);
    });

    it('EDGE: {items: [assistant with usage, delta is 0]} => returns null tokenBadgeLabel', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: ContextTokenDeltaStub({ value: 0 }),
          source: 'session',
        }),
      ]);
    });
  });

  describe('tool pairs', () => {
    it('VALID: {items: [tool-pair, toolUse has usage]} => no tokenBadgeLabel (per-tool delta is misattribution), captures cumulative', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
      ]);
    });

    it('VALID: {items: [tool-pair, toolResult has content]} => returns resultTokenBadgeLabel with ~est', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: 'a'.repeat(370),
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: FormattedTokenLabelStub({ value: '~100 est' }),
          cumulativeContext: null,
          contextDelta: null,
          source: 'session',
        }),
      ]);
    });

    it('VALID: {items: [tool-pair with usage and result]} => no tokenBadgeLabel, but resultTokenBadgeLabel is set', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: 'a'.repeat(370),
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: FormattedTokenLabelStub({ value: '~100 est' }),
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
      ]);
    });

    it('VALID: {items: [tool-pair, no usage, empty result]} => returns all nulls', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });
  });

  describe('tool result entries (not in pairs)', () => {
    it('VALID: {items: [entry with tool_result content]} => returns tokenBadgeLabel with ~est', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantToolResultChatEntryStub({ content: 'a'.repeat(370) }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: FormattedTokenLabelStub({ value: '~100 est' }),
        }),
      ]);
    });

    it('EDGE: {items: [entry with empty tool_result]} => returns null tokenBadgeLabel', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantToolResultChatEntryStub({ content: '' }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });
  });

  describe('source tracking', () => {
    it('VALID: {items: [session, subagent, session]} => prev counters tracked separately; first of each source has no badge', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            source: 'session',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            source: 'subagent',
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
        }),
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            source: 'session',
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: null,
          source: 'subagent',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: FormattedTokenLabelStub({ value: '+700 context' }),
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: ContextTokenDeltaStub({ value: 700 }),
          source: 'session',
        }),
      ]);
    });
  });

  describe('negative delta', () => {
    it('EDGE: {items: [entry with 1200 context, entry with 500 context]} => no badge (negative delta), contextDelta is negative', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
        }),
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: ContextTokenDeltaStub({ value: -700 }),
          source: 'session',
        }),
      ]);
    });
  });

  describe('tool-pair edge cases', () => {
    it('EDGE: {items: [tool-pair with toolResult: null]} => returns null resultTokenBadgeLabel', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          toolResult: null,
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: null,
          contextDelta: null,
          source: 'session',
        }),
      ]);
    });

    it('VALID: {items: [tool-pair with source subagent]} => returns annotation with source subagent', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            source: 'subagent',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'subagent',
        }),
      ]);
    });

    it('VALID: {items: [two tool-pairs with usage]} => both have null tokenBadgeLabel; second tracks contextDelta', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_2',
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_2',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: ContextTokenDeltaStub({ value: 700 }),
          source: 'session',
        }),
      ]);
    });

    it('EDGE: {items: [two tool-pairs with identical usage]} => null tokenBadgeLabel and zero contextDelta', () => {
      const items = [
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_2',
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_2',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: ContextTokenDeltaStub({ value: 0 }),
          source: 'session',
        }),
      ]);
    });
  });

  describe('mixed item types', () => {
    it('VALID: {items: [entry with usage, tool-pair with usage]} => prev counter carries across item types', () => {
      const items = [
        MergedEntryItemStub({
          entry: AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        }),
        MergedToolPairItemStub({
          toolUse: AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 900,
              outputTokens: 100,
              cacheCreationInputTokens: 200,
              cacheReadInputTokens: 100,
            },
          }),
          toolResult: AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: '',
          }),
        }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 500 }),
          contextDelta: null,
          source: 'session',
        }),
        TokenAnnotationStub({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: ContextTokenCountStub({ value: 1200 }),
          contextDelta: ContextTokenDeltaStub({ value: 700 }),
          source: 'session',
        }),
      ]);
    });
  });

  describe('untested entry types', () => {
    it('VALID: {items: [thinking entry]} => returns all-null annotation', () => {
      const items = [MergedEntryItemStub({ entry: AssistantThinkingChatEntryStub() })];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });

    it('VALID: {items: [task notification entry]} => returns all-null annotation', () => {
      const items = [MergedEntryItemStub({ entry: TaskNotificationChatEntryStub() })];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });

    it('VALID: {items: [system error entry]} => returns all-null annotation', () => {
      const items = [MergedEntryItemStub({ entry: SystemErrorChatEntryStub() })];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([TokenAnnotationStub()]);
    });
  });

  describe('output shape', () => {
    it('VALID: {items: N items} => returns exactly N annotations', () => {
      const items = [
        MergedEntryItemStub({ entry: UserChatEntryStub() }),
        MergedEntryItemStub({ entry: AssistantTextChatEntryStub() }),
        MergedEntryItemStub({ entry: UserChatEntryStub() }),
      ];

      const result = computeTokenAnnotationsTransformer({ items });

      expect(result).toStrictEqual([
        TokenAnnotationStub(),
        TokenAnnotationStub(),
        TokenAnnotationStub(),
      ]);
    });

    it('EMPTY: {items: []} => returns empty array', () => {
      const result = computeTokenAnnotationsTransformer({ items: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
