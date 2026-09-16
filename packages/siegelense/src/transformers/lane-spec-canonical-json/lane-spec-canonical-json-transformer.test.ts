import { laneSpecCanonicalJsonTransformer } from './lane-spec-canonical-json-transformer';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';

describe('laneSpecCanonicalJsonTransformer', () => {
  describe('a known spec', () => {
    it('VALID: {the default built-in-shaped stub} => returns its exact canonical JSON', () => {
      const result = laneSpecCanonicalJsonTransformer({ spec: LaneSpecStub() });

      expect(result).toBe(
        '{"name":"dungeonmaster-headless","processes":[{"name":"api","command":"npm",' +
          '"args":["run","dev:no-watch","--workspace=@dungeonmaster/server"],"portRole":"api",' +
          '"readyPath":"/api/guilds","logFileName":"api-server.log",' +
          '"env":{"DUNGEONMASTER_PORT":"{apiPort}"}}],"browser":false,"bootTimeoutMs":180000,' +
          '"env":{"DUNGEONMASTER_PORT":"{apiPort}"}}',
      );
    });
  });

  describe('canonical ordering', () => {
    it('EDGE: {env keys presented in two different orders} => returns the identical JSON', () => {
      const specKeysAscending = LaneSpecStub({ env: { BAR: '2', FOO: '1' } });
      const specKeysDescending = LaneSpecStub({ env: { FOO: '1', BAR: '2' } });

      const resultAscending = laneSpecCanonicalJsonTransformer({ spec: specKeysAscending });
      const resultDescending = laneSpecCanonicalJsonTransformer({ spec: specKeysDescending });

      expect(resultAscending).toBe(resultDescending);
    });
  });

  describe('content sensitivity', () => {
    it('VALID: {a process added to the spec} => returns JSON naming both processes', () => {
      const oneProcessSpec = LaneSpecStub();
      const twoProcessSpec = LaneSpecStub({
        processes: [
          ...oneProcessSpec.processes,
          { ...oneProcessSpec.processes[0], name: 'web', portRole: 'web', readyPath: '/' },
        ],
      });

      const result = laneSpecCanonicalJsonTransformer({ spec: twoProcessSpec });

      expect(result).toBe(
        '{"name":"dungeonmaster-headless","processes":[{"name":"api","command":"npm",' +
          '"args":["run","dev:no-watch","--workspace=@dungeonmaster/server"],"portRole":"api",' +
          '"readyPath":"/api/guilds","logFileName":"api-server.log",' +
          '"env":{"DUNGEONMASTER_PORT":"{apiPort}"}},{"name":"web","command":"npm",' +
          '"args":["run","dev:no-watch","--workspace=@dungeonmaster/server"],"portRole":"web",' +
          '"readyPath":"/","logFileName":"api-server.log",' +
          '"env":{"DUNGEONMASTER_PORT":"{apiPort}"}}],"browser":false,"bootTimeoutMs":180000,' +
          '"env":{"DUNGEONMASTER_PORT":"{apiPort}"}}',
      );
    });
  });
});
