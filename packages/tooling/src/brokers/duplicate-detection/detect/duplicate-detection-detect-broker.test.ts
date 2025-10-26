import { duplicateDetectionDetectBroker } from './duplicate-detection-detect-broker';
import { duplicateDetectionDetectBrokerProxy } from './duplicate-detection-detect-broker.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';
import { OccurrenceThresholdStub } from '../../../contracts/occurrence-threshold/occurrence-threshold.stub';

describe('duplicateDetectionDetectBroker', () => {
  it('VALID: {files with duplicates meeting threshold} => returns duplicate reports', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [
      {
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const x = "error"; const y = "error";' }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const z = "error";' }),
      },
    ];
    const threshold = OccurrenceThresholdStub({ value: 3 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([
      {
        value: 'error',
        type: 'string',
        count: 3,
        occurrences: [
          { filePath: '/file1.ts', line: 1, column: 29 },
          { filePath: '/file1.ts', line: 1, column: 10 },
          { filePath: '/file2.ts', line: 1, column: 10 },
        ],
      },
    ]);
  });

  it('VALID: {files with duplicates below threshold} => returns empty array', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [
      {
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const x = "test";' }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const y = "test";' }),
      },
    ];
    const threshold = OccurrenceThresholdStub({ value: 3 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {files with multiple different duplicates} => returns all sorted by count', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [
      {
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "error"; const b = "error"; const c = "warning";',
        }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const d = "error"; const e = "warning"; const f = "warning";',
        }),
      },
    ];
    const threshold = OccurrenceThresholdStub({ value: 2 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([
      {
        value: 'warning',
        type: 'string',
        count: 3,
        occurrences: [
          { filePath: '/file1.ts', line: 1, column: 48 },
          { filePath: '/file2.ts', line: 1, column: 50 },
          { filePath: '/file2.ts', line: 1, column: 29 },
        ],
      },
      {
        value: 'error',
        type: 'string',
        count: 3,
        occurrences: [
          { filePath: '/file1.ts', line: 1, column: 29 },
          { filePath: '/file1.ts', line: 1, column: 10 },
          { filePath: '/file2.ts', line: 1, column: 10 },
        ],
      },
    ]);
  });

  it('VALID: {minLength: 10} => excludes short strings', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [
      {
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const x = "short"; const y = "very-long-string";',
        }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const z = "short"; const w = "very-long-string";',
        }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file3.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "short"; const b = "very-long-string";',
        }),
      },
    ];
    const threshold = OccurrenceThresholdStub({ value: 3 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold, minLength: 10 });

    expect(result).toStrictEqual([
      {
        value: 'very-long-string',
        type: 'string',
        count: 3,
        occurrences: [
          { filePath: '/file1.ts', line: 1, column: 29 },
          { filePath: '/file2.ts', line: 1, column: 29 },
          { filePath: '/file3.ts', line: 1, column: 29 },
        ],
      },
    ]);
  });

  it('EMPTY: {no files found} => returns empty array', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [] as const;
    const threshold = OccurrenceThresholdStub({ value: 3 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {files with no string literals} => returns empty array', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const files = [
      {
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const x = 123; const y = true;' }),
      },
      {
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const z = 456;' }),
      },
    ];
    const threshold = OccurrenceThresholdStub({ value: 2 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([]);
  });
});
