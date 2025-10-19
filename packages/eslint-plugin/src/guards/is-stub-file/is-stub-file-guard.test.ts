import { isStubFileGuard } from './is-stub-file-guard';

describe('isStubFileGuard', () => {
  describe('valid stub files', () => {
    it('VALID: {filename: "user.stub.ts"} => returns true', () => {
      expect(isStubFileGuard({ filename: 'user.stub.ts' })).toBe(true);
    });

    it('VALID: {filename: "contracts/user-id/user-id.stub.ts"} => returns true', () => {
      expect(isStubFileGuard({ filename: 'contracts/user-id/user-id.stub.ts' })).toBe(true);
    });

    it('VALID: {filename: "/absolute/path/to/file.stub.ts"} => returns true', () => {
      expect(isStubFileGuard({ filename: '/absolute/path/to/file.stub.ts' })).toBe(true);
    });

    it('VALID: {filename: "component.stub.tsx"} => returns true', () => {
      expect(isStubFileGuard({ filename: 'component.stub.tsx' })).toBe(true);
    });
  });

  describe('non-stub files', () => {
    it('VALID: {filename: "user-contract.ts"} => returns false', () => {
      expect(isStubFileGuard({ filename: 'user-contract.ts' })).toBe(false);
    });

    it('VALID: {filename: "user-broker.ts"} => returns false', () => {
      expect(isStubFileGuard({ filename: 'user-broker.ts' })).toBe(false);
    });

    it('VALID: {filename: "stub-factory.ts"} => returns false', () => {
      expect(isStubFileGuard({ filename: 'stub-factory.ts' })).toBe(false);
    });

    it('VALID: {filename: "user.test.ts"} => returns false', () => {
      expect(isStubFileGuard({ filename: 'user.test.ts' })).toBe(false);
    });

    it('VALID: {filename: "component.tsx"} => returns false', () => {
      expect(isStubFileGuard({ filename: 'component.tsx' })).toBe(false);
    });

    it('VALID: {filename: ""} => returns false', () => {
      expect(isStubFileGuard({ filename: '' })).toBe(false);
    });
  });

  describe('optional parameters', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      expect(isStubFileGuard({ filename: undefined })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      expect(isStubFileGuard({})).toBe(false);
    });
  });
});
