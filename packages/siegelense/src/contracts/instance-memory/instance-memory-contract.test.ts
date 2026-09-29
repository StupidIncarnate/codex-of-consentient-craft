import { instanceMemoryContract } from './instance-memory-contract';
import { InstanceMemoryStub } from './instance-memory.stub';

describe('instanceMemoryContract', () => {
  describe('valid readings', () => {
    it('VALID: {measured: live} => a reading of the running lane', () => {
      const result = instanceMemoryContract.parse(
        InstanceMemoryStub({ megabytes: 1840, measured: 'live' }),
      );

      expect(result).toStrictEqual({ megabytes: 1840, measured: 'live' });
    });

    it('VALID: {measured: at-last-beat} => the heartbeat figure a dead instance left behind', () => {
      const result = instanceMemoryContract.parse(
        InstanceMemoryStub({ megabytes: 529, measured: 'at-last-beat' }),
      );

      expect(result).toStrictEqual({ megabytes: 529, measured: 'at-last-beat' });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {measured: "yesterday"} => throws, naming the two accepted values', () => {
      expect(() => instanceMemoryContract.parse({ megabytes: 10, measured: 'yesterday' })).toThrow(
        /'live' \| 'at-last-beat'/u,
      );
    });

    it('INVALID: {megabytes: -1} => throws, because memory is never negative', () => {
      expect(() => instanceMemoryContract.parse({ megabytes: -1, measured: 'live' })).toThrow(
        /greater than or equal to 0/u,
      );
    });
  });
});
