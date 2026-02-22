import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';

import { extractAskUserQuestionTransformer } from './extract-ask-user-question-transformer';

const VALID_TOOL_INPUT = JSON.stringify({
  questions: [
    {
      question: 'Which framework?',
      header: 'Framework Choice',
      options: [
        { label: 'React', description: 'A UI library' },
        { label: 'Vue', description: 'A progressive framework' },
      ],
      multiSelect: false,
    },
  ],
});

describe('extractAskUserQuestionTransformer', () => {
  describe('valid extraction', () => {
    it('VALID: {last entry is AskUserQuestion} => returns parsed question data', () => {
      const result = extractAskUserQuestionTransformer({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub({
            toolName: 'AskUserQuestion' as never,
            toolInput: VALID_TOOL_INPUT as never,
          }),
        ],
      });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Which framework?',
            header: 'Framework Choice',
            options: [
              { label: 'React', description: 'A UI library' },
              { label: 'Vue', description: 'A progressive framework' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {AskUserQuestion in middle, later non-tool entries} => returns parsed question from last AskUserQuestion', () => {
      const result = extractAskUserQuestionTransformer({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub({
            toolName: 'AskUserQuestion' as never,
            toolInput: VALID_TOOL_INPUT as never,
          }),
          AssistantTextChatEntryStub(),
        ],
      });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Which framework?',
            header: 'Framework Choice',
            options: [
              { label: 'React', description: 'A UI library' },
              { label: 'Vue', description: 'A progressive framework' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {multiple AskUserQuestion entries} => returns last one', () => {
      const secondInput = JSON.stringify({
        questions: [
          {
            question: 'Pick a color',
            header: 'Color',
            options: [{ label: 'Red', description: 'Warm color' }],
            multiSelect: true,
          },
        ],
      });

      const result = extractAskUserQuestionTransformer({
        entries: [
          AssistantToolUseChatEntryStub({
            toolName: 'AskUserQuestion' as never,
            toolInput: VALID_TOOL_INPUT as never,
          }),
          AssistantToolUseChatEntryStub({
            toolName: 'AskUserQuestion' as never,
            toolInput: secondInput as never,
          }),
        ],
      });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Pick a color',
            header: 'Color',
            options: [{ label: 'Red', description: 'Warm color' }],
            multiSelect: true,
          },
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {toolInput fails schema validation} => returns null', () => {
      const invalidInput = JSON.stringify({
        questions: 'not an array',
      });

      const result = extractAskUserQuestionTransformer({
        entries: [
          AssistantToolUseChatEntryStub({
            toolName: 'AskUserQuestion' as never,
            toolInput: invalidInput as never,
          }),
        ],
      });

      expect(result).toBeNull();
    });
  });

  describe('no AskUserQuestion found', () => {
    it('VALID: {no AskUserQuestion entries} => returns null', () => {
      const result = extractAskUserQuestionTransformer({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub(),
          AssistantTextChatEntryStub(),
        ],
      });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty entries array} => returns null', () => {
      const result = extractAskUserQuestionTransformer({ entries: [] });

      expect(result).toBeNull();
    });
  });
});
