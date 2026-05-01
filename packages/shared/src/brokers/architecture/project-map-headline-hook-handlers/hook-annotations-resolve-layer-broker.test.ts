import { hookAnnotationsResolveLayerBroker } from './hook-annotations-resolve-layer-broker';
import { hookAnnotationsResolveLayerBrokerProxy } from './hook-annotations-resolve-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });

describe('hookAnnotationsResolveLayerBroker', () => {
  describe('no startup source', () => {
    it('EMPTY: {startupSource: undefined} => returns undefined for both annotations', () => {
      hookAnnotationsResolveLayerBrokerProxy();

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: undefined,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({ spawnName: undefined, fsWritePath: undefined });
    });
  });

  describe('startup source with spawn call', () => {
    it('VALID: {source with spawnSync("npm")} => returns spawnName "npm", no fsWritePath', () => {
      hookAnnotationsResolveLayerBrokerProxy();

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: ContentTextStub({
          value: [
            `import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';`,
            `spawnSync('npm', ['run', 'build'], { cwd: worktreePath });`,
          ].join('\n'),
        }),
        packageRoot: PACKAGE_ROOT,
      });

      expect(String(result.spawnName)).toBe('npm');
      expect(result.fsWritePath).toBe(undefined);
    });
  });

  describe('startup source with fs write', () => {
    it('VALID: {source with writeFileSync(".claude/settings.json")} => returns fsWritePath, no spawnName', () => {
      hookAnnotationsResolveLayerBrokerProxy();

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: ContentTextStub({
          value: [
            `import { HookPostEditFlow } from '../flows/hook-post-edit/hook-post-edit-flow';`,
            `writeFileSync('.claude/settings.json', JSON.stringify(settings));`,
          ].join('\n'),
        }),
        packageRoot: PACKAGE_ROOT,
      });

      expect(result.spawnName).toBe(undefined);
      expect(String(result.fsWritePath)).toBe('.claude/settings.json');
    });
  });

  describe('startup source with no annotations, flow file read falls back', () => {
    it('VALID: {startup with no annotations, flow file missing} => returns undefined for both', () => {
      const proxy = hookAnnotationsResolveLayerBrokerProxy();
      proxy.setupMissing();

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: ContentTextStub({
          value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
        }),
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({ spawnName: undefined, fsWritePath: undefined });
    });

    it('VALID: {startup with no annotations, flow file has spawn} => returns spawnName from flow', () => {
      const proxy = hookAnnotationsResolveLayerBrokerProxy();
      proxy.setupImplementation({
        fn: () =>
          ContentTextStub({
            value: `spawnSync('node', ['dist/check.js']);`,
          }),
      });

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: ContentTextStub({
          value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
        }),
        packageRoot: PACKAGE_ROOT,
      });

      expect(String(result.spawnName)).toBe('node');
      expect(result.fsWritePath).toBe(undefined);
    });
  });

  describe('startup source with no flow import', () => {
    it('EMPTY: {startup with no flow import, no annotations} => returns undefined for both', () => {
      hookAnnotationsResolveLayerBrokerProxy();

      const result = hookAnnotationsResolveLayerBroker({
        startupSource: ContentTextStub({
          value: 'export const StartHook = async () => {};',
        }),
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({ spawnName: undefined, fsWritePath: undefined });
    });
  });
});
