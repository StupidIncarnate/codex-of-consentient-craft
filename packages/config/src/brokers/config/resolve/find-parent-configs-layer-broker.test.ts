import { findParentConfigsLayerBroker } from './find-parent-configs-layer-broker';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { DungeonmasterConfigStub } from '../../../contracts/dungeonmaster-config/dungeonmaster-config.stub';

type DungeonmasterConfig = ReturnType<typeof DungeonmasterConfigStub>;

describe('findParentConfigsLayerBroker', () => {
  describe('finding parent configs', () => {
    it('VALID: {same config found} => stops without adding to configs', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      // dirname('/project/packages/foo') is '/project/packages', and join of that with the real
      // project-config filename is what configFileFindBroker actually resolves to — so this must
      // be that same value for the broker's own identity check to see a genuine match.
      const originalConfigPath = FilePathStub({ value: '/project/packages/.dungeonmaster.json' });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupSameConfigFound({
        currentPath: '/project/packages/foo',
        originalConfigPath: '/project/packages/.dungeonmaster.json',
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([]);
    });

    it('VALID: {parent is monorepo root} => adds parent to configs and stops', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      const originalConfigPath = FilePathStub({
        value: '/project/packages/foo/.dungeonmaster.json',
      });
      // dirname('/project/packages/foo') is '/project/packages' — the real directory
      // configFileFindBroker searches from currentPath, so this is what it actually resolves to.
      const parentConfigPath = '/project/packages/.dungeonmaster.json';
      const parentConfig = DungeonmasterConfigStub({ framework: 'monorepo' });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupMonorepoRootFound({
        currentPath: '/project/packages/foo',
        parentConfigPath,
        parentConfig,
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([parentConfig]);
    });

    it('ERROR: {no parent config found} => handles gracefully without adding to configs', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      const originalConfigPath = FilePathStub({
        value: '/project/packages/foo/.dungeonmaster.json',
      });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupNoParentFound({
        currentPath: '/project/packages/foo',
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([]);
    });

    // The parent is not a monorepo root, so the broker recurses past it — computing the next
    // search directory as dirname(parentConfigPath). That recursive call only reaches the
    // staged grandparent config when dirname was called on the right argument; a wrong argument
    // sends it to an unstaged directory, whose lookup fails and is swallowed by the recursive
    // call's own catch, leaving the grandparent config out of `configs`.
    it('VALID: {parent is not a monorepo root} => walks up to the grandparent and adds both configs', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      const originalConfigPath = FilePathStub({
        value: '/project/packages/foo/.dungeonmaster.json',
      });
      // Each path is the real dirname/join result of the level below it: dirname(currentPath) is
      // '/project/packages' (parentConfigPath's directory); dirname(parentConfigPath) is
      // '/project/packages' again (grandparentPath, the next search start); dirname(that) is
      // '/project' (grandConfigPath's directory).
      const parentConfigPath = '/project/packages/.dungeonmaster.json';
      const grandparentPath = '/project/packages';
      const grandConfigPath = '/project/.dungeonmaster.json';
      const parentConfig = DungeonmasterConfigStub({ framework: 'react' });
      const grandConfig = DungeonmasterConfigStub({ framework: 'monorepo' });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupPackageWithParentAndMonorepoGrandparent({
        currentPath: '/project/packages/foo',
        parentConfigPath,
        parentConfig,
        grandparentPath,
        grandConfigPath,
        grandConfig,
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([grandConfig, parentConfig]);
    });
  });
});
