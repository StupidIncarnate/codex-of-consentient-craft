import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import {
  SingleGroupStub,
  SubagentChainGroupStub,
  ToolGroupStub,
} from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { computeGroupContextDeltasTransformer } from './compute-group-context-deltas-transformer';

describe('computeGroupContextDeltasTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {groups: []} => returns []', () => {
      const result = computeGroupContextDeltasTransformer({ groups: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('groups without context info', () => {
    it('VALID: {single group with user entry} => null delta', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [SingleGroupStub()],
      });

      expect(result).toStrictEqual([null]);
    });

    it('VALID: {tool-group with null contextTokens} => null delta', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [ToolGroupStub({ contextTokens: null })],
      });

      expect(result).toStrictEqual([null]);
    });
  });

  describe('first group with cumulative', () => {
    it('VALID: {single tool-group with cumulative} => null delta (no prev to diff against)', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [ToolGroupStub({ contextTokens: 30000 })],
      });

      expect(result).toStrictEqual([null]);
    });

    it('VALID: {single entry with usage} => null delta', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          SingleGroupStub({
            entry: AssistantTextChatEntryStub({
              usage: {
                inputTokens: 1000,
                outputTokens: 50,
                cacheCreationInputTokens: 2000,
                cacheReadInputTokens: 500,
              },
            }),
          }),
        ],
      });

      expect(result).toStrictEqual([null]);
    });
  });

  describe('cross-group deltas (session)', () => {
    it('VALID: {two tool-groups with cumulative 30k -> 50k} => [null, +20000]', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [ToolGroupStub({ contextTokens: 30000 }), ToolGroupStub({ contextTokens: 50000 })],
      });

      expect(result).toStrictEqual([null, 20000]);
    });

    it('VALID: {single entry then tool-group} => delta carries from single to tool-group', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          SingleGroupStub({
            entry: AssistantTextChatEntryStub({
              usage: {
                inputTokens: 100,
                outputTokens: 50,
                cacheCreationInputTokens: 19000,
                cacheReadInputTokens: 900,
              },
            }),
          }),
          ToolGroupStub({ contextTokens: 35000 }),
        ],
      });

      expect(result).toStrictEqual([null, 15000]);
    });

    it('EDGE: {three tool-groups with non-monotonic cumulative} => negative delta allowed', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          ToolGroupStub({ contextTokens: 30000 }),
          ToolGroupStub({ contextTokens: 50000 }),
          ToolGroupStub({ contextTokens: 40000 }),
        ],
      });

      expect(result).toStrictEqual([null, 20000, -10000]);
    });
  });

  describe('source isolation (session vs subagent)', () => {
    it('VALID: {session group then subagent chain} => prev counters tracked separately', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          ToolGroupStub({ contextTokens: 30000, source: 'session' }),
          SubagentChainGroupStub({ contextTokens: 12000 }),
          ToolGroupStub({ contextTokens: 45000, source: 'session' }),
          SubagentChainGroupStub({ contextTokens: 18000 }),
        ],
      });

      expect(result).toStrictEqual([null, null, 15000, 6000]);
    });

    it('VALID: {subagent tool-group} => delta tracked on subagent counter', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          ToolGroupStub({ contextTokens: 8000, source: 'subagent' }),
          ToolGroupStub({ contextTokens: 14000, source: 'subagent' }),
        ],
      });

      expect(result).toStrictEqual([null, 6000]);
    });
  });

  describe('groups without cumulative do not advance the prev counter', () => {
    it('VALID: {tool-group, single without usage, tool-group} => second tool-group still diffs against first', () => {
      const result = computeGroupContextDeltasTransformer({
        groups: [
          ToolGroupStub({ contextTokens: 10000 }),
          SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
          ToolGroupStub({ contextTokens: 25000 }),
        ],
      });

      expect(result).toStrictEqual([null, null, 15000]);
    });
  });
});
