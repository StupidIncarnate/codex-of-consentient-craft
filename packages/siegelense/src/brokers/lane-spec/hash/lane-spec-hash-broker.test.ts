import { laneSpecHashBroker } from './lane-spec-hash-broker';
import { laneSpecHashBrokerProxy } from './lane-spec-hash-broker.proxy';
import { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';

// sha256 of the default LaneSpecStub's canonical JSON (one 'api' process).
const ONE_PROCESS_HASH = '1f16085bde284fc46d2c79b63ba15a87d04d2d741dbc4b1ff8ce78082ae21dd9';
// sha256 of the same spec with a second, 'web'-portRole process appended.
const TWO_PROCESS_HASH = '76d4e51aee898136c2f87b4bafce8182093e4fff3c9cc3d28312b20e7577bf0e';

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
