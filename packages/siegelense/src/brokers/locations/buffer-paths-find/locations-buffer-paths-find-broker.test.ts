import { locationsBufferPathsFindBroker } from './locations-buffer-paths-find-broker';
import { locationsBufferPathsFindBrokerProxy } from './locations-buffer-paths-find-broker.proxy';

describe('locationsBufferPathsFindBroker', () => {
  describe('buffer path resolution', () => {
    it('VALID: {evidencePath} => the three exact absolute paths', () => {
      locationsBufferPathsFindBrokerProxy();
      const evidencePath =
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21';

      const result = locationsBufferPathsFindBroker({ evidencePath });

      expect(result).toStrictEqual({
        console:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/console.jsonl',
        network:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/network.jsonl',
        websocket:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/ws.jsonl',
      });
    });
  });
});
