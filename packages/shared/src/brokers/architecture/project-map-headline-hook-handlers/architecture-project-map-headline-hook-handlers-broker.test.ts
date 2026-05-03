import { architectureProjectMapHeadlineHookHandlersBroker } from './architecture-project-map-headline-hook-handlers-broker';
import { architectureProjectMapHeadlineHookHandlersBrokerProxy } from './architecture-project-map-headline-hook-handlers-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineHookHandlersStatics } from '../../../statics/project-map-headline-hook-handlers/project-map-headline-hook-handlers-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });

const STARTUP_SOURCE = ContentTextStub({
  value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
});

describe('architectureProjectMapHeadlineHookHandlersBroker', () => {
  describe('empty package (no package.json)', () => {
    it('EMPTY: {no package.json} => hooks section header present', () => {
      const proxy = architectureProjectMapHeadlineHookHandlersBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineHookHandlersBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineHookHandlersStatics.hooksSectionHeader);
    });

    it('EMPTY: {no package.json} => no exemplar section in output', () => {
      const proxy = architectureProjectMapHeadlineHookHandlersBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineHookHandlersBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('## Detailed exemplar'))).toBe(false);
    });
  });

  describe('multi-bin package', () => {
    it('VALID: {two bins} => hooks section header present in output', () => {
      const proxy = architectureProjectMapHeadlineHookHandlersBrokerProxy();
      proxy.setupMultiBin({
        binEntries: {
          'dungeonmaster-pre-edit-lint': './dist/startup/start-pre-edit-hook.js',
          'dungeonmaster-pre-bash': './dist/startup/start-pre-bash-hook.js',
        },
        startupSource: STARTUP_SOURCE,
      });

      const result = architectureProjectMapHeadlineHookHandlersBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineHookHandlersStatics.hooksSectionHeader);
    });

    it('VALID: {two bins} => horizontal rule separator present', () => {
      const proxy = architectureProjectMapHeadlineHookHandlersBrokerProxy();
      proxy.setupMultiBin({
        binEntries: {
          'dungeonmaster-pre-edit-lint': './dist/startup/start-pre-edit-hook.js',
          'dungeonmaster-pre-bash': './dist/startup/start-pre-bash-hook.js',
        },
        startupSource: STARTUP_SOURCE,
      });

      const result = architectureProjectMapHeadlineHookHandlersBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '---')).toBe(true);
    });
  });

  describe('section separators', () => {
    it('VALID: {empty} => horizontal rule separator present', () => {
      const proxy = architectureProjectMapHeadlineHookHandlersBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineHookHandlersBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '---')).toBe(true);
    });
  });
});
