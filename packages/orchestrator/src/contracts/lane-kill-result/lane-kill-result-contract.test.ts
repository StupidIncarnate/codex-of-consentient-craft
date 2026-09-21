import { laneKillResultContract } from './lane-kill-result-contract';
import { LaneKillResultStub } from './lane-kill-result.stub';

describe('laneKillResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stopped: true} => parses', () => {
      const result = LaneKillResultStub({ stopped: true });

      expect(laneKillResultContract.parse(result)).toStrictEqual({ stopped: true });
    });

    it('VALID: {stopped: false} => parses — the orphan-reap-only path never claims a stop', () => {
      const result = LaneKillResultStub({ stopped: false });

      expect(laneKillResultContract.parse(result)).toStrictEqual({ stopped: false });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {stopped missing} => throws Required', () => {
      expect(() => laneKillResultContract.parse({})).toThrow(/Required/u);
    });
  });
});
