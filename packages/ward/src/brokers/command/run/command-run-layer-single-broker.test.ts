import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerSingleBrokerProxy } from './command-run-layer-single-broker.proxy';

describe('commandRunLayerSingleBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {all checks pass, no fileList} => returns WardResult with pass checks', async () => {
      const proxy = commandRunLayerSingleBrokerProxy();
      proxy.setupAllChecksPass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub();

      const result = await commandRunLayerSingleBroker({ config, projectFolder, rootPath });

      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.runId).toBe('1739625600000-a38e');
    });
  });
});
