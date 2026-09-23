import { guildRemoveRouteBroker } from './guild-remove-route-broker';
import { guildRemoveRouteBrokerProxy } from './guild-remove-route-broker.proxy';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts';

describe('guildRemoveRouteBroker', () => {
  describe('a write-only target', () => {
    it('VALID: {record: a guild, no baseUrl} => removes it by id through the bare broker and returns success', async () => {
      const proxy = guildRemoveRouteBrokerProxy();
      const target = DmTargetStub({});
      const guild = GuildStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.succeeds({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = await guildRemoveRouteBroker({ target, record: guild });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('an api-capable target', () => {
    it('VALID: {record: a guild, target.request set} => sends DELETE /api/guilds/:guildId and returns the unwrapped body', async () => {
      guildRemoveRouteBrokerProxy();
      const calls: unknown[] = [];
      const request = async (args: {
        method: string;
        path: string;
        body?: unknown;
      }): Promise<ReturnType<typeof DmHttpResponseStub>> => {
        calls.push(args);
        return Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } }));
      };
      const target = DmTargetStub({ baseUrl: 'http://app.in-process', request });
      const guild = GuildStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = await guildRemoveRouteBroker({ target, record: guild });

      expect(calls).toStrictEqual([
        { method: 'DELETE', path: '/api/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      ]);
      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('a success body carrying fields beyond the contract', () => {
    it('VALID: {body: success plus an extra field} => strips the extra field through adapterResultContract', async () => {
      guildRemoveRouteBrokerProxy();
      const request = async (): Promise<ReturnType<typeof DmHttpResponseStub>> =>
        Promise.resolve(
          DmHttpResponseStub({ status: 200, body: { success: true, sweepCount: 3 } }),
        );
      const target = DmTargetStub({ baseUrl: 'http://app.in-process', request });
      const guild = GuildStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = await guildRemoveRouteBroker({ target, record: guild });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('a non-success status on an api-capable target', () => {
    it('ERROR: {the server answers 500} => throws naming the url and the status', async () => {
      guildRemoveRouteBrokerProxy();
      const request = async (): Promise<ReturnType<typeof DmHttpResponseStub>> =>
        Promise.resolve(DmHttpResponseStub({ status: 500, body: { error: 'guild locked' } }));
      const target = DmTargetStub({ baseUrl: 'http://app.in-process', request });
      const guild = GuildStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      await expect(guildRemoveRouteBroker({ target, record: guild })).rejects.toThrow(
        'http://app.in-process/api/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479 answered 500',
      );
    });
  });
});
