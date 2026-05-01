import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import { HookSessionSnippetPackagesResponder } from './hook-session-snippet-packages-responder';
import { HookSessionSnippetPackagesResponderProxy } from './hook-session-snippet-packages-responder.proxy';

describe('HookSessionSnippetPackagesResponder', () => {
  describe('generatePackageSummary()', () => {
    it('VALID: {projectRoot with a package} => returns compact package list', async () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupPackages({
        packages: [{ name: 'cli' }],
      });

      const result = await HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **cli**' }));
    });

    it('VALID: {projectRoot with no packages dir} => returns root package entry', async () => {
      const proxy = HookSessionSnippetPackagesResponderProxy();

      proxy.setupEmptyMonorepo();

      const result = await HookSessionSnippetPackagesResponder({
        projectRoot: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **root**' }));
    });
  });
});
