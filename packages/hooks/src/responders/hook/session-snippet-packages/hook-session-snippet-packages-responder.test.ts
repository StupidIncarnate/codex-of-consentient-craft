import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { HookSessionSnippetPackagesResponder } from './hook-session-snippet-packages-responder';
import { HookSessionSnippetPackagesResponderProxy } from './hook-session-snippet-packages-responder.proxy';

describe('HookSessionSnippetPackagesResponder', () => {
  describe('package listing', () => {
    it('VALID: {unsorted dirs incl. library packages} => lists every one alphabetically', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
        entries: [
          { name: 'web', isDirectory: true },
          { name: 'shared', isDirectory: true },
          { name: 'cli', isDirectory: true },
          { name: 'testing', isDirectory: true },
          { name: 'config', isDirectory: true },
        ],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        ContentTextStub({
          value: '## Packages\n\n- **cli**\n- **config**\n- **shared**\n- **testing**\n- **web**',
        }),
      );
    });

    it('VALID: {a file beside the dirs} => lists only the directories', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
        entries: [
          { name: 'cli', isDirectory: true },
          { name: 'CLAUDE.md', isDirectory: false },
        ],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **cli**' }));
    });

    it('VALID: {no projectRoot argument} => reads the packages dir under cwd', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/default/cwd' }),
        entries: [{ name: 'hooks', isDirectory: true }],
      });

      const result = HookSessionSnippetPackagesResponder();

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **hooks**' }));
    });
  });

  describe('@-scoped group folders (gateway packages)', () => {
    it('VALID: {@gateway group holding npm and node} => collapses the whole group to one #gateway entry, never @gateway and never its bare child names', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
        entries: [
          { name: 'cli', isDirectory: true },
          {
            name: '@gateway',
            isDirectory: true,
            children: [
              { name: 'npm', isDirectory: true },
              { name: 'node', isDirectory: true },
            ],
          },
        ],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        ContentTextStub({
          value: `## Packages\n\n- **${gatewayLocationsStatics.importPrefix}**\n- **cli**`,
        }),
      );
    });

    it('VALID: {@gateway group with no readdir staged for its children} => still resolves to #gateway without ever reading inside the group folder', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
        entries: [
          { name: 'cli', isDirectory: true },
          { name: '@gateway', isDirectory: true },
        ],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        ContentTextStub({
          value: `## Packages\n\n- **${gatewayLocationsStatics.importPrefix}**\n- **cli**`,
        }),
      );
    });
  });

  describe('single-root fallback', () => {
    it('EMPTY: {packages dir holds no directories} => returns root package entry', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEntries({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
        entries: [{ name: 'CLAUDE.md', isDirectory: false }],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **root**' }));
    });

    it('EMPTY: {no packages dir} => returns root package entry', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEmptyMonorepo({ projectRoot: AbsoluteFilePathStub({ value: '/project' }) });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **root**' }));
    });
  });
});
