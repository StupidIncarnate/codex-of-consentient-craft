import { questStatusWalkPathTransformer } from './quest-status-walk-path-transformer';

describe('questStatusWalkPathTransformer', () => {
  describe('a single hop', () => {
    it('VALID: {from: created, to: explore_flows} => returns [explore_flows]', () => {
      const result = questStatusWalkPathTransformer({ from: 'created', to: 'explore_flows' });

      expect(result).toStrictEqual(['explore_flows']);
    });
  });

  describe('several hops, shortest path over the real edge list', () => {
    it('VALID: {from: created, to: flows_approved} => returns every intermediate status in order', () => {
      const result = questStatusWalkPathTransformer({ from: 'created', to: 'flows_approved' });

      expect(result).toStrictEqual(['explore_flows', 'review_flows', 'flows_approved']);
    });
  });

  describe('a direct edge further along the graph', () => {
    it('VALID: {from: approved, to: in_progress} => returns [in_progress]', () => {
      const result = questStatusWalkPathTransformer({ from: 'approved', to: 'in_progress' });

      expect(result).toStrictEqual(['in_progress']);
    });
  });

  describe('already at the target', () => {
    it('EMPTY: {from: in_progress, to: in_progress} => returns an empty path', () => {
      const result = questStatusWalkPathTransformer({ from: 'in_progress', to: 'in_progress' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a terminal status with no outgoing edges', () => {
    it('ERROR: {from: merged, to: created} => throws naming both ends', () => {
      expect(() => questStatusWalkPathTransformer({ from: 'merged', to: 'created' })).toThrow(
        /^questStatusWalkPathTransformer: no status walk exists from "merged" to "created"$/u,
      );
    });
  });
});
