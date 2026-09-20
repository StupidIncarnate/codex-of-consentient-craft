import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';
import { gitDestructiveBlockStatics } from '../../../statics/git-destructive-block/git-destructive-block-statics';
import { HookAgyPreToolResponder } from './hook-agy-pre-tool-responder';
import { HookAgyPreToolResponderProxy } from './hook-agy-pre-tool-responder.proxy';

describe('HookAgyPreToolResponder', () => {
  describe('run_command', () => {
    it('VALID: {CommandLine: git status} => returns allow', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'run_command',
            args: { CommandLine: 'git status' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'allow',
      });
    });

    it('INVALID: {CommandLine: git checkout -- file.txt} => returns deny with git destructive message', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'run_command',
            args: { CommandLine: 'git checkout -- file.txt' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason: gitDestructiveBlockStatics.blockMessage,
      });
    });

    it('INVALID: {CommandLine: npx jest} => returns deny with ward recommendation', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'run_command',
            args: { CommandLine: 'npx jest' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason: 'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test`',
      });
    });

    it('VALID: {CommandLine: npm run ward | cat} => returns allow with stripped CommandLine', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'run_command',
            args: { CommandLine: 'npm run ward | cat' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'allow',
        overwrite: {
          CommandLine: 'npm run ward',
        },
      });
    });
  });

  describe('write_to_file', () => {
    it('VALID: clean write => returns allow', async () => {
      const proxy = HookAgyPreToolResponderProxy();
      proxy.setupViolationCheck({ hasViolations: false });

      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'write_to_file',
            args: {
              TargetFile: '/test/file.ts',
              CodeContent: 'const x = 1;',
            },
          },
          workspacePaths: ['/test'],
        },
      });

      expect(result).toStrictEqual({
        decision: 'allow',
      });
    });

    it('INVALID: write with violations => returns deny with reason', async () => {
      const proxy = HookAgyPreToolResponderProxy();
      proxy.setupViolationCheck({ hasViolations: true });

      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'write_to_file',
            args: {
              TargetFile: '/test/file.ts',
              CodeContent: 'console.log(1);',
            },
          },
          workspacePaths: ['/test'],
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason:
          '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     This rule violation should be fixed to maintain code quality.\n' +
          '     Line 1:1 - Unexpected console statement\n' +
          '\n' +
          'Your edit was NOT applied — the file is unchanged. Re-submit the ENTIRE corrected edit, not a surgical follow-up (nothing was written, so a patch targeting your intended new text will not match). These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      });
    });
  });

  describe('replace_file_content', () => {
    it('VALID: clean edit => returns allow', async () => {
      const proxy = HookAgyPreToolResponderProxy();
      proxy.setupViolationCheck({ hasViolations: false });

      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'replace_file_content',
            args: {
              TargetFile: '/test/file.ts',
              TargetContent: 'old',
              ReplacementContent: 'new',
            },
          },
          workspacePaths: ['/test'],
        },
      });

      expect(result).toStrictEqual({
        decision: 'allow',
      });
    });

    it('INVALID: edit with violations => returns deny with reason', async () => {
      const proxy = HookAgyPreToolResponderProxy();
      proxy.setupViolationCheck({ hasViolations: true });

      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'replace_file_content',
            args: {
              TargetFile: '/test/file.ts',
              TargetContent: 'old',
              ReplacementContent: 'new',
            },
          },
          workspacePaths: ['/test'],
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason:
          '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     This rule violation should be fixed to maintain code quality.\n' +
          '     Line 1:1 - Unexpected console statement\n' +
          '\n' +
          'Your edit was NOT applied — the file is unchanged. Re-submit the ENTIRE corrected edit, not a surgical follow-up (nothing was written, so a patch targeting your intended new text will not match). These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      });
    });
  });

  describe('search tools', () => {
    it('INVALID: {grep_search} => returns deny with discover message', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'grep_search',
            args: { Query: 'test' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('INVALID: {find_by_name} => returns deny with discover message', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'find_by_name',
            args: { Pattern: '*.ts' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'deny',
        reason: discoverSuggestionMessageStatics.blockMessage,
      });
    });
  });

  describe('other tools', () => {
    it('VALID: {view_file} => returns allow', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: {
          toolCall: {
            name: 'view_file',
            args: { AbsolutePath: '/project/file.ts' },
          },
        },
      });

      expect(result).toStrictEqual({
        decision: 'allow',
      });
    });

    it('EMPTY: {empty input} => returns allow', async () => {
      HookAgyPreToolResponderProxy();
      const result = await HookAgyPreToolResponder({
        hookInput: null,
      });

      expect(result).toStrictEqual({
        decision: 'allow',
      });
    });
  });
});
