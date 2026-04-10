import { HookSessionSnippetFlow } from './hook-session-snippet-flow';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { SessionStartHookStub } from '../../contracts/session-start-hook-data/session-start-hook-data.stub';
import { SubagentStartHookDataStub } from '../../contracts/subagent-start-hook-data/subagent-start-hook-data.stub';

describe('HookSessionSnippetFlow', () => {
  describe('SessionStart', () => {
    it('VALID: {snippetKey: "discover", hookInput: SessionStart} => returns exitCode 0 with raw XML', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'discover',
        hookInput: SessionStartHookStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
        stderr: '',
      });
    });

    it('VALID: {snippetKey: "ward", hookInput: SessionStart} => returns exitCode 0 with raw XML', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'ward',
        hookInput: SessionStartHookStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
        stderr: '',
      });
    });

    it('ERROR: {snippetKey: "nonexistent", hookInput: SessionStart} => returns exitCode 1 with error in stderr', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'nonexistent',
        hookInput: SessionStartHookStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });

    it('ERROR: {snippetKey: undefined, hookInput: SessionStart} => returns exitCode 1 with error in stderr', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: undefined,
        hookInput: SessionStartHookStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: (none)\n',
      });
    });
  });

  describe('SubagentStart', () => {
    it('VALID: {snippetKey: "discover", hookInput: SubagentStart} => returns exitCode 0 with JSON additionalContext', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'discover',
        hookInput: SubagentStartHookDataStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'SubagentStart',
            additionalContext: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {snippetKey: "ward", hookInput: SubagentStart} => returns exitCode 0 with JSON additionalContext', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'ward',
        hookInput: SubagentStartHookDataStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'SubagentStart',
            additionalContext: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
          },
        }),
        stderr: '',
      });
    });

    it('ERROR: {snippetKey: "nonexistent", hookInput: SubagentStart} => returns exitCode 1 with raw error in stderr', () => {
      const result = HookSessionSnippetFlow({
        snippetKey: 'nonexistent',
        hookInput: SubagentStartHookDataStub(),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });
  });
});
