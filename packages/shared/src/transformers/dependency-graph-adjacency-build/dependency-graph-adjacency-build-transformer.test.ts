import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { dependencyGraphAdjacencyBuildTransformer } from './dependency-graph-adjacency-build-transformer';

const pkg = (value: string) => PackageJsonStub({ name: value }).name!;

describe('dependencyGraphAdjacencyBuildTransformer', () => {
  describe('empty package list', () => {
    it('EMPTY: {packages: []} => returns empty adjacency map', () => {
      const result = dependencyGraphAdjacencyBuildTransformer({ packages: [] });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('two packages, one depends on the other', () => {
    it('VALID: {a depends on b} => adjacency maps a to [b], b to []', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');

      const result = dependencyGraphAdjacencyBuildTransformer({
        packages: [
          { name: pkgA, dependencyNames: [pkgB] },
          { name: pkgB, dependencyNames: [] },
        ],
      });

      expect(result).toStrictEqual(
        new Map([
          [pkgA, [pkgB]],
          [pkgB, []],
        ]),
      );
    });
  });

  describe('dependency outside the known package set', () => {
    it('VALID: {a depends on b and an unknown external package} => adjacency excludes the unknown dependency', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const external = pkg('@pkg/external');

      const result = dependencyGraphAdjacencyBuildTransformer({
        packages: [
          { name: pkgA, dependencyNames: [pkgB, external] },
          { name: pkgB, dependencyNames: [] },
        ],
      });

      expect(result).toStrictEqual(
        new Map([
          [pkgA, [pkgB]],
          [pkgB, []],
        ]),
      );
    });
  });

  describe('self-dependency', () => {
    it('VALID: {a lists itself as a dependency} => adjacency excludes the self-loop', () => {
      const pkgA = pkg('@pkg/a');

      const result = dependencyGraphAdjacencyBuildTransformer({
        packages: [{ name: pkgA, dependencyNames: [pkgA] }],
      });

      expect(result).toStrictEqual(new Map([[pkgA, []]]));
    });
  });

  describe('no eligibility filter — every passed package becomes a node', () => {
    it('VALID: {a package nobody depends on and with no dependencies of its own} => still appears as a node', () => {
      const pkgA = pkg('@pkg/a');
      const pkgIsolated = pkg('@pkg/isolated');

      const result = dependencyGraphAdjacencyBuildTransformer({
        packages: [
          { name: pkgA, dependencyNames: [] },
          { name: pkgIsolated, dependencyNames: [] },
        ],
      });

      expect(result).toStrictEqual(
        new Map([
          [pkgA, []],
          [pkgIsolated, []],
        ]),
      );
    });
  });

  describe('diamond dependency', () => {
    it('VALID: {a->b, a->c, b->d, c->d} => adjacency preserves every edge', () => {
      const pkgA = pkg('@pkg/a');
      const pkgB = pkg('@pkg/b');
      const pkgC = pkg('@pkg/c');
      const pkgD = pkg('@pkg/d');

      const result = dependencyGraphAdjacencyBuildTransformer({
        packages: [
          { name: pkgA, dependencyNames: [pkgB, pkgC] },
          { name: pkgB, dependencyNames: [pkgD] },
          { name: pkgC, dependencyNames: [pkgD] },
          { name: pkgD, dependencyNames: [] },
        ],
      });

      expect(result).toStrictEqual(
        new Map([
          [pkgA, [pkgB, pkgC]],
          [pkgB, [pkgD]],
          [pkgC, [pkgD]],
          [pkgD, []],
        ]),
      );
    });
  });
});
