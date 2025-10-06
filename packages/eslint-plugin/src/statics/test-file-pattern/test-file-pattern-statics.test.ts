import { testFilePatternStatics } from './test-file-pattern-statics';

describe('testFilePatternStatics', () => {
  describe('unit', () => {
    it('VALID: suffixes contains unit test patterns', () => {
      expect(testFilePatternStatics.unit.suffixes).toStrictEqual(['.test', '.spec']);
    });
  });

  describe('integration', () => {
    it('VALID: suffixes contains integration test patterns', () => {
      expect(testFilePatternStatics.integration.suffixes).toStrictEqual([
        '.integration.test',
        '.integration.spec',
      ]);
    });
  });

  describe('e2e', () => {
    it('VALID: suffixes contains e2e test patterns', () => {
      expect(testFilePatternStatics.e2e.suffixes).toStrictEqual(['.e2e.test', '.e2e.spec']);
    });
  });

  describe('suffixes', () => {
    it('VALID: contains all expected test file suffixes', () => {
      expect(testFilePatternStatics.suffixes).toStrictEqual([
        '.test',
        '.spec',
        '.integration.test',
        '.integration.spec',
        '.e2e.test',
        '.e2e.spec',
      ]);
    });
  });

  describe('extensions', () => {
    it('VALID: contains TypeScript extensions', () => {
      expect(testFilePatternStatics.extensions).toStrictEqual(['.ts', '.tsx']);
    });
  });
});
