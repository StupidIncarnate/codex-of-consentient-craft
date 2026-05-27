import { stripTrailingSlashTransformer } from './strip-trailing-slash-transformer';

describe('stripTrailingSlashTransformer', () => {
  describe('paths with trailing slash', () => {
    it("VALID: {path: '/home/user/repo/'} => returns '/home/user/repo'", () => {
      const result = stripTrailingSlashTransformer({ path: '/home/user/repo/' });

      expect(result).toBe('/home/user/repo');
    });

    it("VALID: {path: '/home/user/repo//'} => returns '/home/user/repo'", () => {
      const result = stripTrailingSlashTransformer({ path: '/home/user/repo//' });

      expect(result).toBe('/home/user/repo');
    });
  });

  describe('paths without trailing slash', () => {
    it("VALID: {path: '/home/user/repo'} => returns '/home/user/repo'", () => {
      const result = stripTrailingSlashTransformer({ path: '/home/user/repo' });

      expect(result).toBe('/home/user/repo');
    });

    it("VALID: {path: './relative/path'} => returns './relative/path'", () => {
      const result = stripTrailingSlashTransformer({ path: './relative/path' });

      expect(result).toBe('./relative/path');
    });
  });
});
