import { HookPreSearchResponder } from './hook-pre-search-responder';
import { HookPreSearchResponderProxy } from './hook-pre-search-responder.proxy';
import { PreSearchHookDataStub } from '../../../contracts/pre-search-hook-data/pre-search-hook-data.stub';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';

describe('HookPreSearchResponder', () => {
  describe('blocked: exploratory grep', () => {
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

    it('VALID: {tool_name: "Grep", pattern: "broker", output_mode: "files_with_matches"} => blocks', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'broker', output_mode: 'files_with_matches' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });
  });

  describe('blocked: exploratory glob', () => {
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

    it('VALID: {tool_name: "Glob", pattern: "packages/hooks/src/**/*.ts"} => blocks', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Glob',
          tool_input: { pattern: 'packages/hooks/src/**/*.ts' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });
  });

  describe('allowed: grep content search', () => {
    it('VALID: {tool_name: "Grep", output_mode: "content"} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'import', output_mode: 'content' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {tool_name: "Grep", pattern with regex} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'import.*from' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {tool_name: "Grep", context flag -C: 3} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Grep',
          tool_input: { pattern: 'TODO', '-C': 3 },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });
  });

  describe('allowed: glob non-TS files', () => {
    it('VALID: {tool_name: "Glob", pattern: "**/*.json"} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Glob',
          tool_input: { pattern: '**/*.json' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {tool_name: "Glob", pattern: "dist/**/*.js"} => does not block', () => {
      HookPreSearchResponderProxy();

      const result = HookPreSearchResponder({
        input: PreSearchHookDataStub({
          tool_name: 'Glob',
          tool_input: { pattern: 'dist/**/*.js' },
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: false,
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
