import { qaWalkPathContract } from './qa-walk-path-contract';
import { QaWalkPathStub } from './qa-walk-path.stub';

describe('qaWalkPathContract', () => {
  describe('valid paths', () => {
    it('VALID: {full path with branches} => parses the complete itinerary', () => {
      expect(QaWalkPathStub()).toStrictEqual({
        nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
        branchLabels: ['1 or more queued', 'clicks send'],
        exitsFlow: false,
      });
    });

    it('VALID: {single-node path} => parses, because a lone entry node with no edges is its own terminal', () => {
      expect(QaWalkPathStub({ nodeIds: ['only-node'], branchLabels: [] }).nodeIds).toStrictEqual([
        'only-node',
      ]);
    });

    it('VALID: {path crossing into another flow} => records exitsFlow', () => {
      expect(QaWalkPathStub({ exitsFlow: true }).exitsFlow).toBe(true);
    });

    it('VALID: {branchLabels omitted} => defaults to an empty list', () => {
      expect(
        qaWalkPathContract.parse({ nodeIds: ['a-node', 'b-node'] }).branchLabels,
      ).toStrictEqual([]);
    });

    it('VALID: {exitsFlow omitted} => defaults to false', () => {
      expect(qaWalkPathContract.parse({ nodeIds: ['a-node'] }).exitsFlow).toBe(false);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {nodeIds: []} => throws, because a path with no nodes is not an itinerary', () => {
      expect(() => QaWalkPathStub({ nodeIds: [] })).toThrow(
        /Array must contain at least 1 element/u,
      );
    });

    it('INVALID: {non-kebab node id} => throws', () => {
      expect(() => QaWalkPathStub({ nodeIds: ['NotKebab' as never] })).toThrow(/Invalid/u);
    });

    it('EMPTY: {blank branch label} => throws, because an unlabelled edge is sequence, not a decision', () => {
      expect(() => QaWalkPathStub({ branchLabels: ['' as never] })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
