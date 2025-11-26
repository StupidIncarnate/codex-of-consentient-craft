import { integrationEnvironmentCleanupAllBroker } from './integration-environment-cleanup-all-broker';
import { integrationEnvironmentCleanupAllBrokerProxy } from './integration-environment-cleanup-all-broker.proxy';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { TestProjectStub } from '../../../contracts/test-project/test-project.stub';

describe('integrationEnvironmentCleanupAllBroker', () => {
  describe('cleanup all environments', () => {
    it('VALID: no environments => clears tracking without errors', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentCleanupAllBrokerProxy();

      integrationEnvironmentCleanupAllBroker();

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });

    it('VALID: one environment => calls cleanup and clears tracking', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentCleanupAllBrokerProxy();
      const cleanupMock = jest.fn();
      const project = TestProjectStub({ cleanup: cleanupMock });
      integrationEnvironmentTrackingBroker.add({ project });

      integrationEnvironmentCleanupAllBroker();

      expect(cleanupMock).toHaveBeenCalledTimes(1);

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });

    it('VALID: multiple environments => calls cleanup on all and clears tracking', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentCleanupAllBrokerProxy();
      const cleanup1Mock = jest.fn();
      const cleanup2Mock = jest.fn();
      const project1 = TestProjectStub({ projectName: 'test-1', cleanup: cleanup1Mock });
      const project2 = TestProjectStub({ projectName: 'test-2', cleanup: cleanup2Mock });
      integrationEnvironmentTrackingBroker.add({ project: project1 });
      integrationEnvironmentTrackingBroker.add({ project: project2 });

      integrationEnvironmentCleanupAllBroker();

      expect(cleanup1Mock).toHaveBeenCalledTimes(1);
      expect(cleanup2Mock).toHaveBeenCalledTimes(1);

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });
  });
});
