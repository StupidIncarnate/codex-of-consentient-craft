import { extractFirstUserMessageTransformer } from './extract-first-user-message-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('extractFirstUserMessageTransformer', () => {
  describe('valid user message', () => {
    it('VALID: {fileContent: user message} => returns first user message content as summary', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: '{"type":"user","message":{"role":"user","content":"Help me build a login page"}}',
        }),
      });

      expect(result).toBe('Help me build a login page');
    });
  });

  describe('skips meta lines', () => {
    it('VALID: {fileContent: meta user line then real user line} => skips isMeta and returns next user message', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","isMeta":true,"message":{"role":"user","content":"meta content"}}',
            '{"type":"user","message":{"role":"user","content":"real question"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('real question');
    });
  });

  describe('skips command content', () => {
    it('VALID: {fileContent: command prefixed content} => skips command lines', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":"<local-command-caveat>some caveat"}}',
            '{"type":"user","message":{"role":"user","content":"<command-name>init"}}',
            '{"type":"user","message":{"role":"user","content":"actual question here"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('actual question here');
    });

    it('VALID: {fileContent: command prefix content} => skips lines starting with <command', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":"<command>do something"}}',
            '{"type":"user","message":{"role":"user","content":"my real message"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('my real message');
    });
  });

  describe('skips non-user types', () => {
    it('VALID: {fileContent: assistant and system lines before user} => skips non-user types', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"assistant","message":{"role":"assistant","content":"hello"}}',
            '{"type":"system","message":{"role":"system","content":"you are helpful"}}',
            '{"type":"progress","message":"working"}',
            '{"type":"user","message":{"role":"user","content":"first real question"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('first real question');
    });
  });

  describe('truncation', () => {
    it('VALID: {fileContent: long user message} => truncates to 80 chars with ellipsis', () => {
      const longMessage =
        'This is a very long message that exceeds the eighty character limit and should be truncated with an ellipsis at the end';
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: `{"type":"user","message":{"role":"user","content":"${longMessage}"}}`,
        }),
      });

      expect(result).toBe(`${longMessage.substring(0, 80)}...`);
    });
  });

  describe('empty content', () => {
    it('VALID: {fileContent: empty string} => returns undefined', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({ value: '' }),
      });

      expect(result).toBeUndefined();
    });
  });

  describe('no valid user message', () => {
    it('VALID: {fileContent: only assistant lines} => returns undefined', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"assistant","message":{"role":"assistant","content":"hello"}}',
            '{"type":"assistant","message":{"role":"assistant","content":"how can I help"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBeUndefined();
    });
  });

  describe('command name fallback', () => {
    it('VALID: {fileContent: command with args only} => extracts command name with args as fallback', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":"<command-name>/start</command-name><command-message>start</command-message><command-args>plan/flow-changes.md</command-args>"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('/start plan/flow-changes.md');
    });

    it('VALID: {fileContent: command without args} => extracts command name only', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":"<command-name>/sandbox</command-name><command-message>sandbox</command-message>"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('/sandbox');
    });

    it('VALID: {fileContent: real user message before command} => prefers real user message over command', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":"Help me refactor this code"}}',
            '{"type":"user","message":{"role":"user","content":"<command-name>/start</command-name><command-message>start</command-message><command-args>plan/flow-changes.md</command-args>"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('Help me refactor this code');
    });
  });

  describe('array content (tool results)', () => {
    it('VALID: {fileContent: user message with array content} => skips array content lines', () => {
      const result = extractFirstUserMessageTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","message":{"role":"user","content":[{"type":"tool_result","content":"result"}]}}',
            '{"type":"user","message":{"role":"user","content":"actual question"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('actual question');
    });
  });
});
