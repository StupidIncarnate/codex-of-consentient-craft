import { hooksSectionRenderLayerBroker } from './hooks-section-render-layer-broker';
import { hooksSectionRenderLayerBrokerProxy } from './hooks-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineHookHandlersStatics } from '../../../statics/project-map-headline-hook-handlers/project-map-headline-hook-handlers-statics';

const makeEntry = ({ binName, binPath }: { binName: string; binPath: string }) => ({
  binName: ContentTextStub({ value: binName }),
  binPath: ContentTextStub({ value: binPath }),
});

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });

const SIMPLE_STARTUP_SOURCE = ContentTextStub({
  value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
});

const SPAWN_STARTUP_SOURCE = ContentTextStub({
  value: [
    `import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';`,
    `spawnSync('npm', ['run', 'build'], { cwd: worktreePath });`,
  ].join('\n'),
});

const FS_WRITE_STARTUP_SOURCE = ContentTextStub({
  value: [
    `import { HookPostEditFlow } from '../flows/hook-post-edit/hook-post-edit-flow';`,
    `writeFileSync('.claude/settings.json', JSON.stringify(settings));`,
  ].join('\n'),
});

describe('hooksSectionRenderLayerBroker', () => {
  describe('empty bin entries', () => {
    it('EMPTY: {binEntries: []} => renders hooks section header as first line', () => {
      hooksSectionRenderLayerBrokerProxy();

      const result = hooksSectionRenderLayerBroker({
        binEntries: [],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineHookHandlersStatics.hooksSectionHeader);
    });

    it('EMPTY: {binEntries: []} => renders empty message in code block', () => {
      hooksSectionRenderLayerBrokerProxy();

      const result = hooksSectionRenderLayerBroker({
        binEntries: [],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineHookHandlersStatics.hooksSectionEmpty)).toBe(
        true,
      );
    });
  });

  describe('single bin entry, startup file not found', () => {
    it('VALID: {single bin, startup missing} => renders row containing bin name', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-pre-edit-lint',
            binPath: './dist/startup/start-pre-edit-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('dungeonmaster-pre-edit-lint'))).toBe(true);
    });

    it('VALID: {single bin, startup missing} => row shows fallback responder label', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-pre-edit-lint',
            binPath: './dist/startup/start-pre-edit-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('(responder)'))).toBe(true);
    });
  });

  describe('single bin entry with flow import in startup', () => {
    it('VALID: {startup has flow import} => row shows flow file name as label', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => SIMPLE_STARTUP_SOURCE });

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-pre-edit-lint',
            binPath: './dist/startup/start-pre-edit-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('hook-pre-edit-flow'))).toBe(true);
    });
  });

  describe('multiple bin entries', () => {
    it('VALID: {two bins, startup missing} => renders both bin-name rows', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-pre-edit-lint',
            binPath: './dist/startup/start-pre-edit-hook.js',
          }),
          makeEntry({
            binName: 'dungeonmaster-pre-bash',
            binPath: './dist/startup/start-pre-bash-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('dungeonmaster-pre-edit-lint'))).toBe(true);
      expect(lines.some((l) => l.includes('dungeonmaster-pre-bash'))).toBe(true);
    });
  });

  describe('spawn detection', () => {
    it('VALID: {startup with spawnSync call} => spawn annotation line present', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => SPAWN_STARTUP_SOURCE });

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-worktree-create',
            binPath: './dist/startup/start-worktree-create-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l.includes(projectMapHeadlineHookHandlersStatics.spawnAnnotationPrefix)),
      ).toBe(true);
    });

    it('VALID: {startup with spawnSync("npm")} => spawn annotation shows npm', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => SPAWN_STARTUP_SOURCE });

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-worktree-create',
            binPath: './dist/startup/start-worktree-create-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const spawnLine = lines.find((l) =>
        l.includes(projectMapHeadlineHookHandlersStatics.spawnAnnotationPrefix),
      );

      expect(spawnLine).toBe(`${projectMapHeadlineHookHandlersStatics.spawnAnnotationPrefix}npm`);
    });
  });

  describe('fs-write detection', () => {
    it('VALID: {startup with writeFileSync} => fs-write annotation line present', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => FS_WRITE_STARTUP_SOURCE });

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-post-edit-lint',
            binPath: './dist/startup/start-post-edit-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.includes(projectMapHeadlineHookHandlersStatics.fsWriteAnnotationPrefix),
        ),
      ).toBe(true);
    });

    it('VALID: {writeFileSync(".claude/settings.json")} => annotation contains path', () => {
      const proxy = hooksSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => FS_WRITE_STARTUP_SOURCE });

      const result = hooksSectionRenderLayerBroker({
        binEntries: [
          makeEntry({
            binName: 'dungeonmaster-post-edit-lint',
            binPath: './dist/startup/start-post-edit-hook.js',
          }),
        ],
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const writeLine = lines.find((l) =>
        l.includes(projectMapHeadlineHookHandlersStatics.fsWriteAnnotationPrefix),
      );

      expect(writeLine).toBe(
        `${projectMapHeadlineHookHandlersStatics.fsWriteAnnotationPrefix}.claude/settings.json`,
      );
    });
  });
});
