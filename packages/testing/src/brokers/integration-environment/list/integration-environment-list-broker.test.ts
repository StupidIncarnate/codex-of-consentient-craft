import { integrationEnvironmentListBroker } from './integration-environment-list-broker';
import { integrationEnvironmentListBrokerProxy } from './integration-environment-list-broker.proxy';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { TestGuildStub } from '../../../contracts/test-guild/test-guild.stub';

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
      const guild = TestGuildStub();
      integrationEnvironmentTrackingBroker.add({ guild });

      const result = integrationEnvironmentListBroker();

      expect(result).toStrictEqual([guild]);
    });

    it('VALID: multiple environments => returns all guilds', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentListBrokerProxy();
      const guild1 = TestGuildStub({ guildName: 'test-1' });
      const guild2 = TestGuildStub({ guildName: 'test-2' });
      integrationEnvironmentTrackingBroker.add({ guild: guild1 });
      integrationEnvironmentTrackingBroker.add({ guild: guild2 });

      const result = integrationEnvironmentListBroker();

      expect(result).toStrictEqual([guild1, guild2]);
    });
  });
});
