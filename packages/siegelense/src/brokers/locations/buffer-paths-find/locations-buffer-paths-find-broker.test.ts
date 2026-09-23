import { locationsBufferPathsFindBroker } from './locations-buffer-paths-find-broker';
import { locationsBufferPathsFindBrokerProxy } from './locations-buffer-paths-find-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('locationsBufferPathsFindBroker', () => {
  describe('buffer path resolution', () => {
    it('VALID: {evidencePath} => the three exact absolute paths', () => {
      locationsBufferPathsFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
      });

      const result = locationsBufferPathsFindBroker({ evidencePath });

      expect(result).toStrictEqual({
        console: AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/console.jsonl',
        }),
        network: AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/network.jsonl',
        }),
        websocket: AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/ws.jsonl',
        }),
      });
    });
  });
});
