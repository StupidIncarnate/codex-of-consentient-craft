import { HookPreSearchResponder } from './hook-pre-search-responder';
import { HookPreSearchResponderProxy } from './hook-pre-search-responder.proxy';
import { PreSearchHookDataStub } from '../../../contracts/pre-search-hook-data/pre-search-hook-data.stub';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';

describe('HookPreSearchResponder', () => {
  describe('blocked: all grep calls', () => {
    it('VALID: {tool_name: "Grep", pattern: "permission"} => blocks with discover message', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'permission' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {tool_name: "Grep", output_mode: "content"} => blocks with discover message', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'import', output_mode: 'content' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {tool_name: "Grep", pattern with regex} => blocks with discover message', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'import.*from' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });
  });

  describe('blocked: all glob calls', () => {
    it('VALID: {tool_name: "Glob", pattern: "**/*.ts"} => blocks with discover message', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Glob',
          tool_input: { pattern: '**/*.ts' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {tool_name: "Glob", pattern: "**/*.json"} => blocks with discover message', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Glob',
          tool_input: { pattern: '**/*.json' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });
  });

  describe('passthrough: non-PreToolUse events', () => {
    it('VALID: {hook_event_name: "SessionStart"} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: {
          session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          transcript_path: '/tmp/transcript.jsonl',
          cwd: process.cwd(),
          hook_event_name: 'SessionStart',
        },
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });
  });
});
