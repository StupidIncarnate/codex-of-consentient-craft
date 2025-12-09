import { findParentConfigsLayerBroker } from './find-parent-configs-layer-broker';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { DungeonmasterConfigStub } from '../../../contracts/dungeonmaster-config/dungeonmaster-config.stub';

type DungeonmasterConfig = ReturnType<typeof DungeonmasterConfigStub>;

describe('findParentConfigsLayerBroker', () => {
  describe('finding parent configs', () => {
    it('VALID: {same config found} => stops without adding to configs', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      const originalConfigPath = FilePathStub({ value: '/project/packages/foo/.dungeonmaster' });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupSameConfigFound({
        currentPath: '/project/packages/foo',
        originalConfigPath: '/project/packages/foo/.dungeonmaster',
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([]);
    });

    it('VALID: {parent is monorepo root} => adds parent to configs and stops', async () => {
      const proxy = findParentConfigsLayerBrokerProxy();
      const currentPath = FilePathStub({ value: '/project/packages/foo' });
      const originalConfigPath = FilePathStub({ value: '/project/packages/foo/.dungeonmaster' });
      const parentConfigPath = '/project/.dungeonmaster';
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
      const originalConfigPath = FilePathStub({ value: '/project/packages/foo/.dungeonmaster' });
      const configs: DungeonmasterConfig[] = [];

      proxy.setupNoParentFound({
        currentPath: '/project/packages/foo',
      });

      await findParentConfigsLayerBroker({ currentPath, originalConfigPath, configs });

      expect(configs).toStrictEqual([]);
    });
  });
});
