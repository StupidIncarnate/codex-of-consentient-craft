import { integrationEnvironmentTrackingBroker } from './integration-environment-tracking-broker';
import { integrationEnvironmentTrackingBrokerProxy } from './integration-environment-tracking-broker.proxy';
import { TestGuildStub } from '../../../contracts/test-guild/test-guild.stub';

describe('integrationEnvironmentTrackingBroker', () => {
  describe('add and getAll', () => {
    it('VALID: add project => getAll returns project', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const guild = TestGuildStub();

      integrationEnvironmentTrackingBroker.add({ guild });

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([guild]);
    });

    it('VALID: add multiple guilds => getAll returns all guilds', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const guild1 = TestGuildStub({ guildName: 'test-1' });
      const guild2 = TestGuildStub({ guildName: 'test-2' });

      integrationEnvironmentTrackingBroker.add({ guild: guild1 });
      integrationEnvironmentTrackingBroker.add({ guild: guild2 });

      const result = integrationEnvironmentTrackingBroker.getAll();

      expect(result).toStrictEqual([guild1, guild2]);
    });
  });

  describe('clear', () => {
    it('VALID: clear after adding projects => getAll returns empty array', () => {
      integrationEnvironmentTrackingBroker.clear();
      integrationEnvironmentTrackingBrokerProxy();
      const guild = TestGuildStub();
      integrationEnvironmentTrackingBroker.add({ guild });

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
