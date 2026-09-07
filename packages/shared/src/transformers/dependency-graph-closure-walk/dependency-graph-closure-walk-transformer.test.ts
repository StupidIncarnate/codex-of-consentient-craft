import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { dependencyGraphClosureWalkTransformer } from './dependency-graph-closure-walk-transformer';

const pkg = (value: string) => PackageJsonStub({ name: value }).name!;

describe('dependencyGraphClosureWalkTransformer', () => {
  describe('empty inputs', () => {
    it('EMPTY: {adjacency: empty, roots: []} => returns []', () => {
      const result = dependencyGraphClosureWalkTransformer({ adjacency: new Map(), roots: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {roots: [a], adjacency has no entry for a} => returns [a]', () => {
      const pkgA = pkg('@pkg/a');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map(),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA]);
    });
  });

  describe('transitive reach', () => {
    it('VALID: {a->b, b->c} => returns a, b and c', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgA, [pkgB]],
          [pkgB, [pkgC]],
          [pkgC, []],
        ]),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgC]);
    });

    it('VALID: {a->b, b->c, plus an unreachable d} => omits d', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const pkgD = pkg('@pkg/d');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgA, [pkgB]],
          [pkgB, [pkgC]],
          [pkgC, []],
          [pkgD, [pkgA]],
        ]),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgC]);
    });
  });

  describe('shared and repeated nodes', () => {
    it('VALID: {diamond a->b, a->c, b->d, c->d} => reports d once', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const pkgD = pkg('@pkg/d');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgA, [pkgB, pkgC]],
          [pkgB, [pkgD]],
          [pkgC, [pkgD]],
          [pkgD, []],
        ]),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgC, pkgD]);
    });

    it('VALID: {roots: [a, a]} => reports a once', () => {
      const pkgA = pkg('@pkg/a');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([[pkgA, []]]),
        roots: [pkgA, pkgA],
      });

      expect(result).toStrictEqual([pkgA]);
    });

    it('VALID: {two roots sharing a dependency} => reports the shared dependency once', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgShared = pkg('@pkg/shared');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgA, [pkgShared]],
          [pkgB, [pkgShared]],
          [pkgShared, []],
        ]),
        roots: [pkgA, pkgB],
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgShared]);
    });
  });

  describe('cycles', () => {
    it('EDGE: {a->b, b->a} => terminates and returns both', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgA, [pkgB]],
          [pkgB, [pkgA]],
        ]),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA, pkgB]);
    });

    it('EDGE: {a lists itself} => returns just a', () => {
      const pkgA = pkg('@pkg/a');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([[pkgA, [pkgA]]]),
        roots: [pkgA],
      });

      expect(result).toStrictEqual([pkgA]);
    });
  });

  describe('ordering', () => {
    it('VALID: {roots given in reverse alphabetical order} => returns them sorted', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');

      const result = dependencyGraphClosureWalkTransformer({
        adjacency: new Map([
          [pkgC, [pkgA]],
          [pkgB, []],
          [pkgA, []],
        ]),
        roots: [pkgC, pkgB],
      });

      expect(result).toStrictEqual([pkgA, pkgB, pkgC]);
    });
  });
});
