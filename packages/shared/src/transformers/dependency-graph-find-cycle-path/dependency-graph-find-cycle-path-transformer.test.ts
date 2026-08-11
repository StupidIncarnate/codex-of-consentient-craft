import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { dependencyGraphFindCyclePathTransformer } from './dependency-graph-find-cycle-path-transformer';

const pkg = (value: string) => PackageJsonStub({ name: value }).name!;

describe('dependencyGraphFindCyclePathTransformer', () => {
  describe('no cycle reachable', () => {
    it('VALID: {dag a->b->c, residual contains only these} => returns null', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgC]],
        [pkgC, []],
      ]);
      const residual = new Set([pkgA, pkgB, pkgC]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgA,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toBe(null);
    });
  });

  describe('two-node cycle', () => {
    it('INVALID: {a<->b, start at a} => returns [a, b, a]', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgA]],
      ]);
      const residual = new Set([pkgA, pkgB]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgA,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgA]);
    });
  });

  describe('self-loop', () => {
    it('INVALID: {a depends on itself} => returns [a, a]', () => {
      const pkgA = pkg('@pkg/a');
      const adjacency = new Map([[pkgA, [pkgA]]]);
      const residual = new Set([pkgA]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgA,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toStrictEqual([pkgA, pkgA]);
    });
  });

  describe('downstream-of-cycle node excluded', () => {
    it('INVALID: {a<->b cycle, start at c which depends on a} => returns [a, b, a] without c', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgA]],
        [pkgC, [pkgA]],
      ]);
      const residual = new Set([pkgA, pkgB, pkgC]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgC,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgA]);
    });
  });

  describe('deps outside residual are skipped', () => {
    it('VALID: {a->b cycle but b not in residual} => returns null (cycle unreachable through residual edges)', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgA]],
      ]);
      const residual = new Set([pkgA]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgA,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toBe(null);
    });
  });

  describe('three-node cycle', () => {
    it('INVALID: {a->b->c->a, start at a} => returns [a, b, c, a]', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const adjacency = new Map([
        [pkgA, [pkgB]],
        [pkgB, [pkgC]],
        [pkgC, [pkgA]],
      ]);
      const residual = new Set([pkgA, pkgB, pkgC]);

      const result = dependencyGraphFindCyclePathTransformer({
        adjacency,
        residual,
        node: pkgA,
        path: [],
        pathIndex: new Map(),
        visited: new Set(),
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgC, pkgA]);
    });
  });
});
