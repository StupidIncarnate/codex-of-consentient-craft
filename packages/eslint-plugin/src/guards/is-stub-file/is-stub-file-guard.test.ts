import { isStubFileGuard } from './is-stub-file-guard';

describe('isStubFileGuard', () => {
  describe('valid stub files', () => {
    it('VALID: {filename: "user.stub.ts"} => returns true', () => {
      const result = isStubFileGuard({ filename: 'user.stub.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user.stub.tsx"} => returns true', () => {
      const result = isStubFileGuard({ filename: 'user.stub.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user.stub"} => returns true', () => {
      const result = isStubFileGuard({ filename: 'user.stub' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/path/to/user.stub.ts"} => returns true', () => {
      const result = isStubFileGuard({ filename: '/path/to/user.stub.ts' });

      expect(result).toBe(true);
    });
  });

  describe('non-stub files', () => {
    it('VALID: {filename: "user-contract.ts"} => returns false', () => {
      const result = isStubFileGuard({ filename: 'user-contract.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "user.ts"} => returns false', () => {
      const result = isStubFileGuard({ filename: 'user.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "stub.ts"} => returns false', () => {
      const result = isStubFileGuard({ filename: 'stub.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "user.test.ts"} => returns false', () => {
      const result = isStubFileGuard({ filename: 'user.test.ts' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: ""} => returns false', () => {
      const result = isStubFileGuard({ filename: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const result = isStubFileGuard({});

      expect(result).toBe(false);
    });
  });
});
