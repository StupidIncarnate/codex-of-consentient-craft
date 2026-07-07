import { FlowEdgeStub } from '@dungeonmaster/shared/contracts';

import { ElkPositionMapStub } from '../../contracts/elk-position-map/elk-position-map.stub';
import { flowBranchLabelOffsetsTransformer } from './flow-branch-label-offsets-transformer';

describe('flowBranchLabelOffsetsTransformer', () => {
  describe('single-branch sources', () => {
    it('EMPTY: {source has one labeled edge} => no offsets (nothing to spread)', () => {
      const edge = FlowEdgeStub({ id: 'a-to-b', from: 'a', to: 'b', label: 'go' });
      const positions = ElkPositionMapStub({
        a: { x: 0, y: 0 },
        b: { x: 0, y: 200 },
      });

      const result = flowBranchLabelOffsetsTransformer({ edges: [edge], positions });

      expect(result).toStrictEqual({});
    });

    it('EMPTY: {unlabeled edges} => ignored, no offsets', () => {
      const edge1 = FlowEdgeStub({ id: 'e1', from: 'dec', to: 'left', label: undefined });
      const edge2 = FlowEdgeStub({ id: 'e2', from: 'dec', to: 'down', label: undefined });
      const positions = ElkPositionMapStub({
        dec: { x: 200, y: 0 },
        left: { x: 0, y: 200 },
        down: { x: 200, y: 200 },
      });

      const result = flowBranchLabelOffsetsTransformer({ edges: [edge1, edge2], positions });

      expect(result).toStrictEqual({});
    });
  });

  describe('reconverging branches (crowded)', () => {
    it('VALID: {one branch peels left, one runs straight down} => each clears the spine on its side', () => {
      // dec spine at x=200. "left" branch midpoint = 100 (natDist -100); "down" branch is straight
      // below (natDist 0), so it takes the side opposite "left" (the right). Each is pushed to the
      // clearance distance (140) off the spine: left -> midpoint 100 minus 140-off-spine = -40;
      // down -> spine + 140 = +140 off its midpoint.
      const toLeft = FlowEdgeStub({ id: 'dec-to-left', from: 'dec', to: 'left', label: 'missing' });
      const toDown = FlowEdgeStub({
        id: 'dec-to-down',
        from: 'dec',
        to: 'down',
        label: 'loads ok',
      });
      const positions = ElkPositionMapStub({
        dec: { x: 200, y: 0 },
        left: { x: 0, y: 200 },
        down: { x: 200, y: 400 },
      });

      const result = flowBranchLabelOffsetsTransformer({ edges: [toLeft, toDown], positions });

      expect(result).toStrictEqual({ 'dec-to-left': -40, 'dec-to-down': 140 });
    });

    it('VALID: {three near-central labels} => two stack left, one right, all clearing the spine', () => {
      // dec spine at x=300. Targets 280/300/320 => natDist -10 / 0 / +10. The straight-down b1 goes
      // to the lighter side (left, tying with the right count). Left holds b1 (spine +140 => -140)
      // and b0 (stacked minSep beyond => -310); right holds b2 (clearance 140 => +130).
      const b0 = FlowEdgeStub({ id: 'b0', from: 'dec', to: 'n0', label: 'a' });
      const b1 = FlowEdgeStub({ id: 'b1', from: 'dec', to: 'n1', label: 'b' });
      const b2 = FlowEdgeStub({ id: 'b2', from: 'dec', to: 'n2', label: 'c' });
      const positions = ElkPositionMapStub({
        dec: { x: 300, y: 0 },
        n0: { x: 280, y: 200 },
        n1: { x: 300, y: 200 },
        n2: { x: 320, y: 200 },
      });

      const result = flowBranchLabelOffsetsTransformer({ edges: [b0, b1, b2], positions });

      expect(result).toStrictEqual({ b0: -310, b1: -140, b2: 130 });
    });
  });

  describe('well-separated branches (fork)', () => {
    it('VALID: {two labels whose midpoints already clear the spine} => zero offsets (keep midpoints)', () => {
      // dec spine at x=200. Far-apart symmetric targets => natDist -400 and +400, both already well
      // past the 140 clearance, so each keeps its natural midpoint (offset 0).
      const toFarLeft = FlowEdgeStub({
        id: 'dec-to-far-left',
        from: 'dec',
        to: 'far-left',
        label: 'invalid',
      });
      const toFarRight = FlowEdgeStub({
        id: 'dec-to-far-right',
        from: 'dec',
        to: 'far-right',
        label: 'valid',
      });
      const positions = ElkPositionMapStub({
        dec: { x: 200, y: 0 },
        'far-left': { x: -600, y: 200 },
        'far-right': { x: 1000, y: 200 },
      });

      const result = flowBranchLabelOffsetsTransformer({
        edges: [toFarLeft, toFarRight],
        positions,
      });

      expect(result).toStrictEqual({ 'dec-to-far-left': 0, 'dec-to-far-right': 0 });
    });
  });
});
