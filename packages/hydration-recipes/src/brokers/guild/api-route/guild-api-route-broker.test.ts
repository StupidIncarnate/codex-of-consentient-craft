import { guildApiRouteBroker } from './guild-api-route-broker';
import { guildApiRouteBrokerProxy } from './guild-api-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

describe('guildApiRouteBroker', () => {
  describe('a relative path in fields', () => {
    it('VALID: {name, relative path} => posts the derived absolute path to /api/guilds', async () => {
      const proxy = guildApiRouteBrokerProxy();
      const target = DmTargetStub({
        home: '/tmp/dm-home',
        claudeHome: '/tmp/dm-home',
        baseUrl: 'http://app.in-process',
      });
      const response = DmHttpResponseStub({
        status: 201,
        body: { id: 'f47ac10b', name: 'Guild 1', path: '/tmp/dm-home/guilds-under-test/guild-1' },
      });
      proxy.succeeds({ url: 'http://app.in-process/api/guilds', response });

      const result = await guildApiRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
      });
    });
  });

  describe('a non-success status', () => {
    it('ERROR: {the server answers 500} => throws naming the url and the status', async () => {
      const proxy = guildApiRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });
      proxy.succeeds({ url: 'http://app.in-process/api/guilds', response });

      await expect(
        guildApiRouteBroker({
          target,
          fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
        }),
      ).rejects.toThrow('http://app.in-process/api/guilds answered 500');
    });
  });
});
