import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';

import { orchestrateRunAllLayerCheckBroker } from './orchestrate-run-all-layer-check-broker';
import { orchestrateRunAllLayerCheckBrokerProxy } from './orchestrate-run-all-layer-check-broker.proxy';

describe('orchestrateRunAllLayerCheckBroker', () => {
  describe('lint check', () => {
    it('VALID: {checkType lint, exits 0} => returns pass result', async () => {
      const proxy = orchestrateRunAllLayerCheckBrokerProxy();
      proxy.setupLintPass();

      const projectFolder = ProjectFolderStub();

      const result = await orchestrateRunAllLayerCheckBroker({
        checkType: 'lint',
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: '[]', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('typecheck check', () => {
    it('VALID: {checkType typecheck, exits 0} => returns pass result', async () => {
      const proxy = orchestrateRunAllLayerCheckBrokerProxy();
      proxy.setupTypecheckPass();

      const projectFolder = ProjectFolderStub();

      const result = await orchestrateRunAllLayerCheckBroker({
        checkType: 'typecheck',
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('test check', () => {
    it('VALID: {checkType test, exits 0} => returns pass result', async () => {
      const proxy = orchestrateRunAllLayerCheckBrokerProxy();
      proxy.setupTestPass();

      const projectFolder = ProjectFolderStub();

      const result = await orchestrateRunAllLayerCheckBroker({
        checkType: 'test',
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '{"testResults":[],"success":true}',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });
});
