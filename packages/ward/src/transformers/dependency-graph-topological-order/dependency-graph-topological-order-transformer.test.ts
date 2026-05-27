import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { dependencyGraphTopologicalOrderTransformer } from './dependency-graph-topological-order-transformer';

const pkg = (value: string) => PackageJsonStub({ name: value }).name!;

describe('dependencyGraphTopologicalOrderTransformer', () => {
  describe('empty graph', () => {
    it('EMPTY: {adjacency: empty map} => returns empty order', () => {
      const result = dependencyGraphTopologicalOrderTransformer({
        adjacency: new Map(),
      });

      expect(result).toStrictEqual({ order: [], cycle: null });
    });
  });

  describe('single node no edges', () => {
    it('VALID: {single node, no deps} => returns that node in order', () => {
      const pkgA = pkg('@pkg/a');
      const adjacency = new Map([[pkgA, []]]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: [pkgA], cycle: null });
    });
  });

  describe('linear chain', () => {
    it('VALID: {a depends on b, b depends on c} => returns [c, b, a] (leaves first)', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgC]],
        [pkgC, []],
      ]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: [pkgC, pkgB, pkgA], cycle: null });
    });
  });

  describe('diamond dependency', () => {
    it('VALID: {a->b, a->c, b->d, c->d} => d comes first, a comes last', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const pkgD = pkg('@pkg/d');
      const adjacency = new Map([
        [pkgA, [pkgB, pkgC]],
        [pkgB, [pkgD]],
        [pkgC, [pkgD]],
        [pkgD, []],
      ]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: [pkgD, pkgB, pkgC, pkgA], cycle: null });
    });
  });

  describe('cycle detection', () => {
    it('INVALID: {a depends on b, b depends on a} => returns closed cycle path [a, b, a]', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgA]],
      ]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: null, cycle: [pkgA, pkgB, pkgA] });
    });
  });

  describe('self-loop', () => {
    it('INVALID: {a depends on itself} => returns closed cycle path [a, a]', () => {
      const pkgA = pkg('@pkg/a');
      const adjacency = new Map([[pkgA, [pkgA]]]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: null, cycle: [pkgA, pkgA] });
    });
  });

  describe('cycle with non-cycle dependent', () => {
    it('INVALID: {a<->b cycle, c depends on a} => cycle excludes c (downstream-of-cycle, not in cycle)', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgA]],
        [pkgC, [pkgA]],
      ]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: null, cycle: [pkgA, pkgB, pkgA] });
    });
  });

  describe('multiple disconnected components', () => {
    it('VALID: {two independent chains a->b and c->d} => returns leaves first from each chain', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const pkgD = pkg('@pkg/d');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, []],
        [pkgC, [pkgD]],
        [pkgD, []],
      ]);

      const result = dependencyGraphTopologicalOrderTransformer({ adjacency });

      expect(result).toStrictEqual({ order: [pkgB, pkgD, pkgA, pkgC], cycle: null });
    });
  });
});
