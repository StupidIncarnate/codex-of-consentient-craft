import { isImplementationFileGuard } from './is-implementation-file-guard';

describe('isImplementationFileGuard', () => {
  describe('implementation files', () => {
    it('VALID: {filename: "src/brokers/user/user-broker.ts"} => returns true', () => {
      const result = isImplementationFileGuard({
        filename: 'src/brokers/user/user-broker.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "src/guards/is-admin/is-admin-guard.ts"} => returns true', () => {
      const result = isImplementationFileGuard({
        filename: 'src/guards/is-admin/is-admin-guard.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "src/widgets/user-card/user-card-widget.tsx"} => returns true', () => {
      const result = isImplementationFileGuard({
        filename: 'src/widgets/user-card/user-card-widget.tsx',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-broker.ts"} => returns true', () => {
      const result = isImplementationFileGuard({
        filename: 'user-broker.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('multi-dot files', () => {
    it('VALID: {filename: "src/brokers/user/user-broker.test.ts"} => returns false', () => {
      const result = isImplementationFileGuard({
        filename: 'src/brokers/user/user-broker.test.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "src/brokers/user/user-broker.proxy.ts"} => returns false', () => {
      const result = isImplementationFileGuard({
        filename: 'src/brokers/user/user-broker.proxy.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "src/contracts/user/user.stub.ts"} => returns false', () => {
      const result = isImplementationFileGuard({
        filename: 'src/contracts/user/user.stub.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "src/startup/start-server.integration.test.ts"} => returns false', () => {
      const result = isImplementationFileGuard({
        filename: 'src/startup/start-server.integration.test.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isImplementationFileGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      const result = isImplementationFileGuard({ filename: '' });

      expect(result).toBe(false);
    });

    it('EDGE: {filename: "file.ts"} => returns true', () => {
      const result = isImplementationFileGuard({ filename: 'file.ts' });

      expect(result).toBe(true);
    });

    it('EDGE: {filename: "/path/to/file.js"} => returns true', () => {
      const result = isImplementationFileGuard({ filename: '/path/to/file.js' });

      expect(result).toBe(true);
    });
  });
});
