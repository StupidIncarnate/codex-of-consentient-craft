import { laneSpecHashBroker } from './lane-spec-hash-broker';
import { laneSpecHashBrokerProxy } from './lane-spec-hash-broker.proxy';
import { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';

// sha256 of the default LaneSpecStub's canonical JSON (one 'api' process).
const ONE_PROCESS_HASH = 'dbd088fdde932c4b04e62596e0bdef02b9bd3f9a16dffadd2005879775905e16';
// sha256 of the same spec with a second, 'web'-portRole process appended.
const TWO_PROCESS_HASH = '2b88d0768d017f7200c1a4ddca31179db39a33d51c3bc9248aa19041120b2e89';

describe('laneSpecHashBroker', () => {
  describe('a known spec', () => {
    it('VALID: {the default stub} => returns its exact sha256 hex digest', () => {
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
