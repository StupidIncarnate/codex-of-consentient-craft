import { isNonTestFileGuard } from './is-non-test-file-guard';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

const NON_TEST_PATHS = [
  '/repo/packages/shared/src/guards/is-non-test-file/is-non-test-file-guard.ts',
  '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
  '/repo/package.json',
  '/repo/README.md',
] as const;

const TEST_PATHS = [
  '/repo/packages/shared/src/guards/foo/foo-guard.test.ts',
  '/repo/packages/web/src/widgets/foo/foo-widget.test.tsx',
  '/repo/packages/shared/src/brokers/foo/foo-broker.proxy.ts',
  '/repo/packages/web/src/widgets/foo/foo-widget.proxy.tsx',
  '/repo/packages/shared/src/contracts/foo/foo.stub.ts',
  '/repo/packages/server/src/flows/foo/foo-flow.integration.test.ts',
] as const;

describe('isNonTestFileGuard', () => {
  describe('non-test files', () => {
    it.each(NON_TEST_PATHS)('VALID: {filePath: %s} => returns true', (path) => {
      const filePath = AbsoluteFilePathStub({ value: path });

      const result = isNonTestFileGuard({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('test/proxy/stub files', () => {
    it.each(TEST_PATHS)('VALID: {filePath: %s} => returns false', (path) => {
      const filePath = AbsoluteFilePathStub({ value: path });

      const result = isNonTestFileGuard({ filePath });

      expect(result).toBe(false);
    });
  });

  describe('every suffix in projectMapStatics.testFileSuffixes', () => {
    it.each(projectMapStatics.testFileSuffixes)(
      'VALID: {filePath ending in %s} => returns false',
      (suffix) => {
        const filePath = AbsoluteFilePathStub({ value: `/repo/foo/bar${suffix}` });

        const result = isNonTestFileGuard({ filePath });

        expect(result).toBe(false);
      },
    );
  });

  describe('integration test suffix precedence', () => {
    it('VALID: {filePath: ...integration.test.ts} => returns false (longer suffix matches)', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/foo/foo-flow.integration.test.ts',
      });

      const result = isNonTestFileGuard({ filePath });

      expect(result).toBe(false);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isNonTestFileGuard({});

      expect(result).toBe(false);
    });
  });
});
