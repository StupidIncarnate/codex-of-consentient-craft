import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { mergeCommandOutputEntriesTransformer } from './merge-command-output-entries-transformer';

describe('mergeCommandOutputEntriesTransformer', () => {
  describe('contiguous command output', () => {
    it('VALID: {three text lines} => returns ONE entry joining them with newlines, keeping the first uuid and timestamp', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: '— build pass 1/3 —',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: '> tsc',
          uuid: 'line-2',
          timestamp: '2024-01-15T10:00:01.000Z',
        }),
        AssistantTextChatEntryStub({
          content: '— build green on pass 1/3 —',
          uuid: 'line-3',
          timestamp: '2024-01-15T10:00:02.000Z',
        }),
      ];

      const result = mergeCommandOutputEntriesTransformer({ entries });

      expect(result).toStrictEqual([
        AssistantTextChatEntryStub({
          content: '— build pass 1/3 —\n> tsc\n— build green on pass 1/3 —',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });

    // A build prints blank lines between packages. As separate entries each one drew its own
    // bordered, labelled block; inside a merged block it is just a newline.
    it('EDGE: {blank lines between output} => blank lines survive as interior newlines, not as separate entries', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: '> @dungeonmaster/testing@0.1.0 build',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: '',
          uuid: 'line-2',
          timestamp: '2024-01-15T10:00:01.000Z',
        }),
        AssistantTextChatEntryStub({
          content: '> tsc',
          uuid: 'line-3',
          timestamp: '2024-01-15T10:00:02.000Z',
        }),
      ];

      const result = mergeCommandOutputEntriesTransformer({ entries });

      expect(result).toStrictEqual([
        AssistantTextChatEntryStub({
          content: '> @dungeonmaster/testing@0.1.0 build\n\n> tsc',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });
  });

  describe('run boundaries', () => {
    it('VALID: {text, tool_use, text} => the tool entry breaks the run into two separate blocks', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: 'before',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        AssistantToolUseChatEntryStub({
          uuid: 'tool-1',
          timestamp: '2024-01-15T10:00:01.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'after',
          uuid: 'line-2',
          timestamp: '2024-01-15T10:00:02.000Z',
        }),
      ];

      const result = mergeCommandOutputEntriesTransformer({ entries });

      expect(result).toStrictEqual(entries);
    });

    it('VALID: {session line then subagent line} => a source change breaks the run so sub-agent output never lands inside a session block', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: 'session line',
          source: 'session',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'subagent line',
          source: 'subagent',
          uuid: 'line-2',
          timestamp: '2024-01-15T10:00:01.000Z',
        }),
      ];

      const result = mergeCommandOutputEntriesTransformer({ entries });

      expect(result).toStrictEqual(entries);
    });

    // usage is one API call's accounting and computeTokenAnnotationsTransformer draws a context
    // divider off it, so absorbing such an entry would delete a divider.
    it('VALID: {text carrying usage} => is left standing alone rather than absorbed', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: 'plain',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'accounted',
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
          uuid: 'line-2',
          timestamp: '2024-01-15T10:00:01.000Z',
        }),
      ];

      const result = mergeCommandOutputEntriesTransformer({ entries });

      expect(result).toStrictEqual(entries);
    });
  });

  describe('nothing to merge', () => {
    it('EMPTY: {no entries} => returns an empty list', () => {
      expect(mergeCommandOutputEntriesTransformer({ entries: [] })).toStrictEqual([]);
    });

    it('VALID: {a single text entry} => returns that exact entry untouched', () => {
      const entries = [
        AssistantTextChatEntryStub({
          content: 'only line',
          uuid: 'line-1',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ];

      expect(mergeCommandOutputEntriesTransformer({ entries })).toStrictEqual(entries);
    });
  });
});
