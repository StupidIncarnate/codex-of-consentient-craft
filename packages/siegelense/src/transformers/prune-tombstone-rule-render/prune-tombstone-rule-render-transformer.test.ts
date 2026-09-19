import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { PruneQueryStub } from '../../contracts/prune-query/prune-query.stub';
import { pruneTombstoneRuleRenderTransformer } from './prune-tombstone-rule-render-transformer';

describe('pruneTombstoneRuleRenderTransformer', () => {
  describe('the window alone', () => {
    it('VALID: {olderThan: "7d"} => "olderThan 7d", the spec\'s own tombstone wording', () => {
      expect(pruneTombstoneRuleRenderTransformer({ query: PruneQueryStub() })).toBe('olderThan 7d');
    });
  });

  describe('a narrowed prune', () => {
    it('VALID: {instance and window} => both, instance first', () => {
      expect(
        pruneTombstoneRuleRenderTransformer({
          query: PruneQueryStub({ instanceId: InstanceIdStub({ value: 'inst_9b2c' }) }),
        }),
      ).toBe('instance inst_9b2c, olderThan 7d');
    });

    it('VALID: {kind and window} => both, kind before the window', () => {
      expect(
        pruneTombstoneRuleRenderTransformer({
          query: PruneQueryStub({ kind: 'video' as never, olderThan: '2d' as never }),
        }),
      ).toBe('kind video, olderThan 2d');
    });

    it('VALID: {all three selectors} => all three, in the order a caller types them', () => {
      expect(
        pruneTombstoneRuleRenderTransformer({
          query: PruneQueryStub({
            instanceId: InstanceIdStub({ value: 'inst_9b2c' }),
            kind: 'shot' as never,
            olderThan: '30m' as never,
          }),
        }),
      ).toBe('instance inst_9b2c, kind shot, olderThan 30m');
    });
  });
});
