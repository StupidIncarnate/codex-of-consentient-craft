import { HookSessionSnippetFlow } from './hook-session-snippet-flow';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';

describe('HookSessionSnippetFlow', () => {
  describe('snippet key lookup', () => {
    it('VALID: {snippetKey: "discover"} => returns exitCode 0 with discover content wrapped in XML', () => {
      const result = HookSessionSnippetFlow({ snippetKey: 'discover' });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
        stderr: '',
      });
    });

    it('VALID: {snippetKey: "ward"} => returns exitCode 0 with ward content wrapped in XML', () => {
      const result = HookSessionSnippetFlow({ snippetKey: 'ward' });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
        stderr: '',
      });
    });

    it('ERROR: {snippetKey: "nonexistent"} => returns exitCode 1 with error in stderr', () => {
      const result = HookSessionSnippetFlow({ snippetKey: 'nonexistent' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });

    it('ERROR: {snippetKey: undefined} => returns exitCode 1 with error in stderr', () => {
      const result = HookSessionSnippetFlow({ snippetKey: undefined });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: (none)\n',
      });
    });
  });
});
