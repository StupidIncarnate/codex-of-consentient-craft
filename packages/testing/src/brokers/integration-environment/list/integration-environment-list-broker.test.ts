import { integrationEnvironmentListBroker } from './integration-environment-list-broker';
import { integrationEnvironmentListBrokerProxy } from './integration-environment-list-broker.proxy';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { TestProjectStub } from '../../../contracts/test-project/test-project.stub';

describe('integrationEnvironmentListBroker', () => {
  describe('list environments', () => {
    it('VALID: no environments => returns empty array', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentListBrokerProxy();

      const result = integrationEnvironmentListBroker();

      expect(result).toStrictEqual([]);
    });

    it('VALID: one environment => returns array with one project', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentListBrokerProxy();
      const project = TestProjectStub();
      integrationEnvironmentTrackingBroker.add({ project });

      const result = integrationEnvironmentListBroker();

      expect(result).toStrictEqual([project]);
    });

    it('VALID: multiple environments => returns all projects', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentListBrokerProxy();
      const project1 = TestProjectStub({ projectName: 'test-1' });
      const project2 = TestProjectStub({ projectName: 'test-2' });
      integrationEnvironmentTrackingBroker.add({ project: project1 });
      integrationEnvironmentTrackingBroker.add({ project: project2 });

      const result = integrationEnvironmentListBroker();

      expect(result).toStrictEqual([project1, project2]);
    });
  });
});
