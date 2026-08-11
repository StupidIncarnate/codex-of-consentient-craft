import { questPackageEntryContract } from './quest-package-entry-contract';
import { QuestPackageEntryStub } from './quest-package-entry.stub';

const CHANGE_TYPES = questPackageEntryContract.shape.changeType.options;
const PACKAGE_TYPES = questPackageEntryContract.shape.packageType.unwrap().options;

describe('questPackageEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {name, location, changeType, packageType} => parses with usedBy absent', () => {
      const entry = QuestPackageEntryStub();

      expect(entry).toStrictEqual({
        name: 'auth-service',
        location: './packages/auth-service',
        changeType: 'edit',
        packageType: 'library',
      });
    });

    it('VALID: {usedBy: two consumers} => round-trips the reverse edges a new package needs', () => {
      const entry = QuestPackageEntryStub({
        name: 'token-store',
        location: './packages/token-store',
        changeType: 'new',
        packageType: 'programmatic-service',
        usedBy: ['auth-service', 'gateway'],
      });

      expect(entry).toStrictEqual({
        name: 'token-store',
        location: './packages/token-store',
        changeType: 'new',
        packageType: 'programmatic-service',
        usedBy: ['auth-service', 'gateway'],
      });
    });

    it('EMPTY: {usedBy: []} => parses, because the non-empty rule for a new package binds at write time and not on the shape', () => {
      const entry = QuestPackageEntryStub({ changeType: 'new', usedBy: [] });

      expect(entry).toStrictEqual({
        name: 'auth-service',
        location: './packages/auth-service',
        changeType: 'new',
        packageType: 'library',
        usedBy: [],
      });
    });

    it('VALID: {location: absolute path} => parses, so a quest running outside a packages/<name> layout is representable', () => {
      const entry = QuestPackageEntryStub({ location: '/srv/monorepo/apps/auth-service' });

      expect(entry.location).toBe('/srv/monorepo/apps/auth-service');
    });

    it.each(CHANGE_TYPES)(
      'VALID: {changeType: %s} => parses the closed axis member',
      (changeType) => {
        const entry = QuestPackageEntryStub({ changeType });

        expect(entry.changeType).toBe(changeType);
      },
    );

    it.each(PACKAGE_TYPES)(
      'VALID: {packageType: %s} => parses the detected package kind',
      (packageType) => {
        const entry = QuestPackageEntryStub({ packageType });

        expect(entry.packageType).toBe(packageType);
      },
    );
  });

  describe('invalid entries', () => {
    it('EMPTY: {name: ""} => throws validation error', () => {
      expect(() => QuestPackageEntryStub({ name: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {location: "packages/auth-service"} => throws, a bare relative path carries neither a leading slash nor a ./ prefix', () => {
      expect(() => QuestPackageEntryStub({ location: 'packages/auth-service' })).toThrow(
        /Path must be absolute/u,
      );
    });

    it('INVALID: {changeType: "rename"} => throws validation error', () => {
      expect(() => QuestPackageEntryStub({ changeType: 'rename' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {packageType: "frontend-vue"} => throws validation error', () => {
      expect(() => QuestPackageEntryStub({ packageType: 'frontend-vue' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {usedBy: [""]} => throws validation error', () => {
      expect(() => QuestPackageEntryStub({ usedBy: [''] })).toThrow(/too_small/u);
    });

    it('EMPTY: {} => throws validation error', () => {
      expect(() => questPackageEntryContract.parse({})).toThrow(/Required/u);
    });
  });
});
