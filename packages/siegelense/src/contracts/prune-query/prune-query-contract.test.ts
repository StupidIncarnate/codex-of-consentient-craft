import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { pruneQueryContract } from './prune-query-contract';
import { PruneQueryStub } from './prune-query.stub';

describe('pruneQueryContract', () => {
  describe('valid queries', () => {
    it('VALID: {olderThan: "7d"} => the window-only form parses with both other selectors null', () => {
      const query = PruneQueryStub();

      const result = pruneQueryContract.parse(query);

      expect(result).toStrictEqual({ instanceId: null, kind: null, olderThan: '7d' });
    });

    it('VALID: {instanceId} => the one-instance form parses', () => {
      const query = PruneQueryStub({ instanceId: InstanceIdStub({ value: 'inst_9b2c' }) });

      const result = pruneQueryContract.parse(query);

      expect(result).toStrictEqual({ instanceId: 'inst_9b2c', kind: null, olderThan: '7d' });
    });

    it('VALID: {kind: "video", olderThan: "2d"} => the two selectors combine, which is the spec\'s own worked call', () => {
      const query = PruneQueryStub({ kind: 'video' as never, olderThan: '2d' as never });

      const result = pruneQueryContract.parse(query);

      expect(result).toStrictEqual({ instanceId: null, kind: 'video', olderThan: '2d' });
    });
  });

  describe('invalid queries', () => {
    it('INVALID: {olderThan omitted} => throws, so a prune can never default to taking everything', () => {
      expect(() => {
        pruneQueryContract.parse({ instanceId: null, kind: null });
      }).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: "inst_"} => a malformed instance id throws naming the shape it needed', () => {
      expect(() => {
        PruneQueryStub({ instanceId: 'inst_' as never });
      }).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {an extra key} => .strict() throws rather than accepting a selector nothing applies', () => {
      expect(() => {
        pruneQueryContract.parse({
          instanceId: null,
          kind: null,
          olderThan: '7d',
          questId: 'q1',
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
