import { reapedInstanceContract } from './reaped-instance-contract';
import { ReapedInstanceStub } from './reaped-instance.stub';

describe('reapedInstanceContract', () => {
  describe('valid rows', () => {
    it('VALID: {id: "inst_9b2c", killed: [33812, 33840]} => parses spec line 1357 verbatim', () => {
      const reaped = ReapedInstanceStub({
        id: 'inst_9b2c',
        staleFor: '9h',
        killed: [33_812, 33_840],
        homeRemoved: true,
      });

      const result = reapedInstanceContract.parse(reaped);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        staleFor: '9h',
        killed: [33_812, 33_840],
        homeRemoved: true,
      });
    });

    it('EDGE: {killed: []} => every recorded pgid was already gone before cleanup signalled it', () => {
      const reaped = ReapedInstanceStub({ killed: [] });

      const result = reapedInstanceContract.parse(reaped);

      expect(result.killed).toStrictEqual([]);
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {missing homeRemoved} => throws Required', () => {
      expect(() =>
        reapedInstanceContract.parse({
          id: 'inst_9b2c',
          staleFor: '9h',
          killed: [33_812],
        }),
      ).toThrow(/Required/u);
    });
  });
});
