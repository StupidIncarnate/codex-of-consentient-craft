import { packageGraphEntryContract } from './package-graph-entry-contract';
import { PackageGraphEntryStub } from './package-graph-entry.stub';

const CHANGE_TYPES = packageGraphEntryContract.shape.changeType.options;

describe('packageGraphEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {id, depth: 0, no dependencies} => parses as a leaf of the graph', () => {
      const entry = PackageGraphEntryStub();

      expect(entry).toStrictEqual({
        id: 'auth-service',
        dependsOn: [],
        depth: 0,
        packageType: 'library',
        changeType: 'edit',
      });
    });

    it('VALID: {dependsOn: two packages, depth: 2} => round-trips the adjacency and its layer', () => {
      const entry = PackageGraphEntryStub({
        id: 'gateway',
        dependsOn: ['auth-service', 'token-store'],
        depth: 2,
        packageType: 'http-backend',
      });

      expect(entry).toStrictEqual({
        id: 'gateway',
        dependsOn: ['auth-service', 'token-store'],
        depth: 2,
        packageType: 'http-backend',
        changeType: 'edit',
      });
    });

    it('VALID: {dependsOn omitted} => defaults to empty, the shape a leaf carries', () => {
      const entry = packageGraphEntryContract.parse({
        id: 'auth-service',
        depth: 0,
        packageType: 'library',
        changeType: 'edit',
      });

      expect(entry).toStrictEqual({
        id: 'auth-service',
        dependsOn: [],
        depth: 0,
        packageType: 'library',
        changeType: 'edit',
      });
    });

    it.each(CHANGE_TYPES)(
      'VALID: {changeType: %s} => parses, because the graph is the post-quest state and carries added and removed nodes alike',
      (changeType) => {
        const entry = PackageGraphEntryStub({ changeType });

        expect(entry.changeType).toBe(changeType);
      },
    );
  });

  describe('invalid entries', () => {
    it('EMPTY: {id: ""} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ id: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {depth: -1} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ depth: -1 })).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {depth: 1.5} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ depth: 1.5 })).toThrow(/Expected integer/u);
    });

    it('INVALID: {dependsOn: [""]} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ dependsOn: [''] })).toThrow(/too_small/u);
    });

    it('INVALID: {packageType: "frontend-vue"} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ packageType: 'frontend-vue' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {changeType: "rename"} => throws validation error', () => {
      expect(() => PackageGraphEntryStub({ changeType: 'rename' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {} => throws validation error', () => {
      expect(() => packageGraphEntryContract.parse({})).toThrow(/Required/u);
    });
  });
});
