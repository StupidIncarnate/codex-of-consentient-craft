import { ContentTextStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { HookSessionSnippetPackagesResponder } from './hook-session-snippet-packages-responder';
import { HookSessionSnippetPackagesResponderProxy } from './hook-session-snippet-packages-responder.proxy';

describe('HookSessionSnippetPackagesResponder', () => {
  describe('generatePackageSummary()', () => {
    it('VALID: {projectRoot with packages} => returns compact package list with descriptions', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupPackages({
        packages: [
          { name: 'cli', description: ContentTextStub({ value: 'CLI for quest management' }) },
          {
            name: 'shared',
            description: ContentTextStub({ value: 'Shared contracts and utilities' }),
          },
        ],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Packages',
            '',
            '- **cli** — CLI for quest management',
            '- **shared** — Shared contracts and utilities',
          ].join('\n'),
        }),
      );
    });

    it('VALID: {projectRoot with package without description} => returns name only', () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupPackages({
        packages: [{ name: 'bare' }],
      });

      const result = HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **bare**' }));
    });
  });
});
