import { integrationEnvironmentCleanupAllBroker } from './integration-environment-cleanup-all-broker';
import { integrationEnvironmentCleanupAllBrokerProxy } from './integration-environment-cleanup-all-broker.proxy';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { TestGuildStub } from '../../../contracts/test-guild/test-guild.stub';

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
      const guild = TestGuildStub({ cleanup: cleanupMock });
      integrationEnvironmentTrackingBroker.add({ guild });

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
      const guild1 = TestGuildStub({ guildName: 'test-1', cleanup: cleanup1Mock });
      const guild2 = TestGuildStub({ guildName: 'test-2', cleanup: cleanup2Mock });
      integrationEnvironmentTrackingBroker.add({ guild: guild1 });
      integrationEnvironmentTrackingBroker.add({ guild: guild2 });

      integrationEnvironmentCleanupAllBroker();

      expect(cleanup1Mock).toHaveBeenCalledTimes(1);
      expect(cleanup2Mock).toHaveBeenCalledTimes(1);

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([]);
    });
  });
});
