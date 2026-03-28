import { testFilePatternStatics } from './test-file-pattern-statics';

describe('testFilePatternStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(testFilePatternStatics).toStrictEqual({
      unit: {
        suffixes: ['.test', '.spec'],
      },
      integration: {
        suffixes: ['.integration.test', '.integration.spec'],
      },
      e2e: {
        suffixes: ['.e2e.test', '.e2e.spec'],
      },
      suffixes: [
        '.test',
        '.spec',
        '.integration.test',
        '.integration.spec',
        '.e2e.test',
        '.e2e.spec',
      ],
      extensions: ['.ts', '.tsx'],
    });
  });
});
