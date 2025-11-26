import { integrationEnvironmentTrackingBroker } from './integration-environment-tracking-broker';
import { integrationEnvironmentTrackingBrokerProxy } from './integration-environment-tracking-broker.proxy';
import { TestProjectStub } from '../../../contracts/test-project/test-project.stub';

describe('integrationEnvironmentTrackingBroker', () => {
  describe('add and getAll', () => {
    it('VALID: add project => getAll returns project', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const project = TestProjectStub();

      integrationEnvironmentTrackingBroker.add({ project });

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([project]);
    });

    it('VALID: add multiple projects => getAll returns all projects', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const project1 = TestProjectStub({ projectName: 'test-1' });
      const project2 = TestProjectStub({ projectName: 'test-2' });

      integrationEnvironmentTrackingBroker.add({ project: project1 });
      integrationEnvironmentTrackingBroker.add({ project: project2 });

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([project1, project2]);
    });
  });

  describe('clear', () => {
    it('VALID: clear after adding projects => getAll returns empty array', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const project = TestProjectStub();
      integrationEnvironmentTrackingBroker.add({ project });

      integrationEnvironmentTrackingBroker.clear();

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });

    it('VALID: clear with no projects => getAll returns empty array', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();

      integrationEnvironmentTrackingBroker.clear();

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });
  });
});
