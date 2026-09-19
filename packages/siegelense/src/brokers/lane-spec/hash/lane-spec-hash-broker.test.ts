import { laneSpecHashBroker } from './lane-spec-hash-broker';
import { laneSpecHashBrokerProxy } from './lane-spec-hash-broker.proxy';
import { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';

// sha256 of the default LaneSpecStub's canonical JSON (one 'api' process).
const ONE_PROCESS_HASH = '115942c3cb8ab9ae5c319e25cd20c8e578fd7d92a21a25d3e4af91fb63ddb9d2';
// sha256 of the same spec with a second, 'web'-portRole process appended.
const TWO_PROCESS_HASH = '1eeee776411de2e0b2e5c7f5f0fcb56292128ef7db656f296c44032d712b4940';

describe('laneSpecHashBroker', () => {
  describe('a known spec', () => {
    it('VALID: {the default built-in-shaped stub} => returns its exact sha256 hex digest', () => {
      laneSpecHashBrokerProxy();

      const result = laneSpecHashBroker({ spec: LaneSpecStub() });

      expect(result).toBe(ONE_PROCESS_HASH);
    });
  });

  describe('canonical ordering', () => {
    it('EDGE: {env keys presented in two different orders} => returns the identical hash', () => {
      laneSpecHashBrokerProxy();
      const specKeysAscending = LaneSpecStub({ env: { BAR: '2', FOO: '1' } });
      const specKeysDescending = LaneSpecStub({ env: { FOO: '1', BAR: '2' } });

      const resultAscending = laneSpecHashBroker({ spec: specKeysAscending });
      const resultDescending = laneSpecHashBroker({ spec: specKeysDescending });

      expect(resultAscending).toBe(resultDescending);
    });
  });

  describe('content sensitivity', () => {
    it('VALID: {a process added to the spec} => returns a different hash than the spec without it', () => {
      laneSpecHashBrokerProxy();
      const oneProcessSpec = LaneSpecStub();
      const twoProcessSpec = LaneSpecStub({
        processes: [
          ...oneProcessSpec.processes,
          { ...oneProcessSpec.processes[0], name: 'web', portRole: 'web', readyPath: '/' },
        ],
      });

      const result = laneSpecHashBroker({ spec: twoProcessSpec });

      expect(result).toBe(TWO_PROCESS_HASH);
    });
  });
});
