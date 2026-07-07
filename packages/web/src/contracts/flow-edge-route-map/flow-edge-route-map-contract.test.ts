import { flowEdgeRouteMapContract } from './flow-edge-route-map-contract';
import { FlowEdgeRouteMapStub } from './flow-edge-route-map.stub';

describe('flowEdgeRouteMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {an edge with start, bend, end points} => parses successfully', () => {
      const result = flowEdgeRouteMapContract.parse({
        e1: [
          { x: 0, y: 0 },
          { x: 0, y: 60 },
          { x: 120, y: 60 },
        ],
      });

      expect(result).toStrictEqual({
        e1: [
          { x: 0, y: 0 },
          { x: 0, y: 60 },
          { x: 120, y: 60 },
        ],
      });
    });

    it('EMPTY: {} => parses empty map', () => {
      const result = flowEdgeRouteMapContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: stub default => produces the sample L-shaped route', () => {
      const result = FlowEdgeRouteMapStub();

      expect(result).toStrictEqual({
        e1: [
          { x: 0, y: 0 },
          { x: 0, y: 60 },
          { x: 120, y: 60 },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {point missing y} => throws validation error', () => {
      expect(() => {
        flowEdgeRouteMapContract.parse({ e1: [{ x: 0 }] });
      }).toThrow(/Required/u);
    });
  });
});
