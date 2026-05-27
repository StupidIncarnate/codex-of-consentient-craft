import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { workspaceInputBuildLayerBroker } from './workspace-input-build-layer-broker';
import { workspaceInputBuildLayerBrokerProxy } from './workspace-input-build-layer-broker.proxy';

describe('workspaceInputBuildLayerBroker()', () => {
  describe('eligible workspace', () => {
    it('VALID: {tsconfig present, no noEmit} => isCompositeEligible: true with dep names', async () => {
      const proxy = workspaceInputBuildLayerBrokerProxy();
      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/hooks","dependencies":{"@dm/shared":"*"}}',
      });

      const result = await workspaceInputBuildLayerBroker({
        folder: ProjectFolderStub({ name: 'hooks', path: '/repo/packages/hooks' }),
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/hooks',
        packageName: '@dm/hooks',
        dependencyNames: ['@dm/shared'],
        isCompositeEligible: true,
      });
    });
  });

  describe('ineligible workspace', () => {
    it('VALID: {tsconfig has noEmit: true} => isCompositeEligible: false', async () => {
      const proxy = workspaceInputBuildLayerBrokerProxy();
      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"noEmit":true}}',
        packageJson: '{"name":"@dm/tools"}',
      });

      const result = await workspaceInputBuildLayerBroker({
        folder: ProjectFolderStub({ name: 'tools', path: '/repo/packages/tools' }),
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/tools',
        packageName: '@dm/tools',
        dependencyNames: [],
        isCompositeEligible: false,
      });
    });

    it('VALID: {no tsconfig} => isCompositeEligible: false', async () => {
      const proxy = workspaceInputBuildLayerBrokerProxy();
      proxy.setupWorkspace({
        tsconfigJson: null,
        packageJson: '{"name":"@dm/scripts"}',
      });

      const result = await workspaceInputBuildLayerBroker({
        folder: ProjectFolderStub({ name: 'scripts', path: '/repo/packages/scripts' }),
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/scripts',
        packageName: '@dm/scripts',
        dependencyNames: [],
        isCompositeEligible: false,
      });
    });

    it('VALID: {no package.json} => dependencyNames empty, packageName undefined', async () => {
      const proxy = workspaceInputBuildLayerBrokerProxy();
      proxy.setupWorkspace({
        tsconfigJson: '{}',
        packageJson: null,
      });

      const result = await workspaceInputBuildLayerBroker({
        folder: ProjectFolderStub({ name: 'orphan', path: '/repo/packages/orphan' }),
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/orphan',
        dependencyNames: [],
        isCompositeEligible: true,
      });
    });
  });
});
