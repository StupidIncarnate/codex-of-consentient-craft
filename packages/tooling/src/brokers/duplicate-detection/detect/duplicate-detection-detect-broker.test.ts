import { duplicateDetectionDetectBroker } from './duplicate-detection-detect-broker';
import { duplicateDetectionDetectBrokerProxy } from './duplicate-detection-detect-broker.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';
import { OccurrenceThresholdStub } from '../../../contracts/occurrence-threshold/occurrence-threshold.stub';

// Helper function to create file test data
const createFile = (params: {
  filePath: ReturnType<typeof AbsoluteFilePathStub>;
  sourceCode: ReturnType<typeof SourceCodeStub>;
}) => {
  return params;
};

describe('duplicateDetectionDetectBroker', () => {
  it('VALID: {files with duplicates meeting threshold} => returns duplicate reports', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const file1 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
      sourceCode: SourceCodeStub({ value: 'const x = "error"; const y = "error";' }),
    });
    const file2 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
      sourceCode: SourceCodeStub({ value: 'const z = "error";' }),
    });
    const files = [file1, file2];
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
    const file1 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
      sourceCode: SourceCodeStub({ value: 'const x = "test";' }),
    });
    const file2 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
      sourceCode: SourceCodeStub({ value: 'const y = "test";' }),
    });
    const files = [file1, file2];
    const threshold = OccurrenceThresholdStub({ value: 3 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {files with multiple different duplicates} => returns all sorted by count', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const file1 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
      sourceCode: SourceCodeStub({
        value: 'const a = "error"; const b = "error"; const c = "warning";',
      }),
    });
    const file2 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
      sourceCode: SourceCodeStub({
        value: 'const d = "error"; const e = "warning"; const f = "warning";',
      }),
    });
    const files = [file1, file2];
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
    const file1 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
      sourceCode: SourceCodeStub({
        value: 'const x = "short"; const y = "very-long-string";',
      }),
    });
    const file2 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
      sourceCode: SourceCodeStub({
        value: 'const z = "short"; const w = "very-long-string";',
      }),
    });
    const file3 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file3.ts' }),
      sourceCode: SourceCodeStub({
        value: 'const a = "short"; const b = "very-long-string";',
      }),
    });
    const files = [file1, file2, file3];
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
    const file1 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
      sourceCode: SourceCodeStub({ value: 'const x = 123; const y = true;' }),
    });
    const file2 = createFile({
      filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
      sourceCode: SourceCodeStub({ value: 'const z = 456;' }),
    });
    const files = [file1, file2];
    const threshold = OccurrenceThresholdStub({ value: 2 });

    brokerProxy.setupFiles({ pattern, files });

    const result = await duplicateDetectionDetectBroker({ pattern, threshold });

    expect(result).toStrictEqual([]);
  });

  describe('regex literal detection', () => {
    it('VALID: {regex with flags /test/g} => detects regex type', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const p1 = /test/g; const p2 = /test/g;' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const p3 = /test/g;' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: '/test/g',
          type: 'regex',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 31 },
            { filePath: '/file1.ts', line: 1, column: 11 },
            { filePath: '/file2.ts', line: 1, column: 11 },
          ],
        },
      ]);
    });

    it('VALID: {regex without flags /test/} => detects regex type', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const p1 = /test/; const p2 = /test/;' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const p3 = /test/;' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: '/test/',
          type: 'regex',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 30 },
            { filePath: '/file1.ts', line: 1, column: 11 },
            { filePath: '/file2.ts', line: 1, column: 11 },
          ],
        },
      ]);
    });

    it('VALID: {regex with multiple flags /test/gimsu} => detects regex type', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const p1 = /test/gimsu; const p2 = /test/gimsu;',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const p3 = /test/gimsu;' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: '/test/gimsu',
          type: 'regex',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 35 },
            { filePath: '/file1.ts', line: 1, column: 11 },
            { filePath: '/file2.ts', line: 1, column: 11 },
          ],
        },
      ]);
    });

    it('VALID: {mixed strings and regex} => returns both types correctly', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const s = "error"; const r = /test/g; const s2 = "error";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const s3 = "error"; const r2 = /test/g; const r3 = /test/g;',
        }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'error',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 49 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 11 },
          ],
        },
        {
          value: '/test/g',
          type: 'regex',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 29 },
            { filePath: '/file2.ts', line: 1, column: 51 },
            { filePath: '/file2.ts', line: 1, column: 31 },
          ],
        },
      ]);
    });

    it('VALID: {only regex literals} => returns only regex reports', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const r1 = /pattern/i; const r2 = /pattern/i;',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const r3 = /pattern/i;' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: '/pattern/i',
          type: 'regex',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 34 },
            { filePath: '/file1.ts', line: 1, column: 11 },
            { filePath: '/file2.ts', line: 1, column: 11 },
          ],
        },
      ]);
    });
  });

  describe('default parameters', () => {
    it('VALID: {threshold omitted} => uses default threshold of 3', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "test"; const b = "test"; const c = "test";',
        }),
      });
      const files = [file1];

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern });

      expect(result).toStrictEqual([
        {
          value: 'test',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 46 },
            { filePath: '/file1.ts', line: 1, column: 28 },
            { filePath: '/file1.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('VALID: {minLength omitted} => uses default minLength of 3', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "ab"; const b = "ab"; const c = "ab"; const d = "abc";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const e = "abc"; const f = "abc";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'abc',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 58 },
            { filePath: '/file2.ts', line: 1, column: 27 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });
  });

  describe('cwd parameter', () => {
    it('VALID: {cwd provided} => passes cwd to glob adapter', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const cwd = AbsoluteFilePathStub({ value: '/custom/path' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/custom/path/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const x = "test"; const y = "test"; const z = "test";',
        }),
      });
      const files = [file1];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, cwd, threshold });

      expect(result).toStrictEqual([
        {
          value: 'test',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/custom/path/file1.ts', line: 1, column: 46 },
            { filePath: '/custom/path/file1.ts', line: 1, column: 28 },
            { filePath: '/custom/path/file1.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('VALID: {cwd omitted} => uses current directory', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const x = "test"; const y = "test"; const z = "test";',
        }),
      });
      const files = [file1];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'test',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 46 },
            { filePath: '/file1.ts', line: 1, column: 28 },
            { filePath: '/file1.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });
  });

  describe('special characters in literals', () => {
    it('VALID: {strings with escaped quotes} => handles escaped characters', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "He said \\"hello\\""; const b = "He said \\"hello\\"";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "He said \\"hello\\"";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'He said "hello"',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 41 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('VALID: {strings with newlines} => handles multiline strings', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "line1\\nline2"; const b = "line1\\nline2";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "line1\\nline2";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'line1\nline2',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 36 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('VALID: {strings with unicode} => handles unicode characters', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "Hello 👋 世界"; const b = "Hello 👋 世界";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "Hello 👋 世界";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'Hello 👋 世界',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 35 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('VALID: {strings with backslashes} => handles escape sequences', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "C:\\\\path\\\\to\\\\file"; const b = "C:\\\\path\\\\to\\\\file";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "C:\\\\path\\\\to\\\\file";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'C:\\path\\to\\file',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 42 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });
  });

  describe('threshold boundary cases', () => {
    it('EDGE: {duplicates at exact threshold} => includes them', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const a = "exact"; const b = "exact";' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "exact";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'exact',
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

    it('EDGE: {duplicates one below threshold} => excludes them', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const a = "below";' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const b = "below";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {threshold: 2, multiple duplicates} => returns all meeting threshold', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const a = "twice"; const b = "twice"; const c = "once";',
        }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({
          value: 'const d = "thrice"; const e = "thrice"; const f = "thrice";',
        }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 2 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold });

      expect(result).toStrictEqual([
        {
          value: 'thrice',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file2.ts', line: 1, column: 50 },
            { filePath: '/file2.ts', line: 1, column: 30 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
        {
          value: 'twice',
          type: 'string',
          count: 2,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 29 },
            { filePath: '/file1.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });
  });

  describe('minLength boundary cases', () => {
    it('EDGE: {strings at exact minLength} => includes them', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const a = "abc"; const b = "abc";' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "abc";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold, minLength: 3 });

      expect(result).toStrictEqual([
        {
          value: 'abc',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 27 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });

    it('EDGE: {strings one char below minLength} => excludes them', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const a = "ab"; const b = "ab";' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "ab";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold, minLength: 3 });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {minLength: 1} => includes single character strings', async () => {
      const brokerProxy = duplicateDetectionDetectBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const file1 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file1.ts' }),
        sourceCode: SourceCodeStub({ value: 'const a = "x"; const b = "x";' }),
      });
      const file2 = createFile({
        filePath: AbsoluteFilePathStub({ value: '/file2.ts' }),
        sourceCode: SourceCodeStub({ value: 'const c = "x";' }),
      });
      const files = [file1, file2];
      const threshold = OccurrenceThresholdStub({ value: 3 });

      brokerProxy.setupFiles({ pattern, files });

      const result = await duplicateDetectionDetectBroker({ pattern, threshold, minLength: 1 });

      expect(result).toStrictEqual([
        {
          value: 'x',
          type: 'string',
          count: 3,
          occurrences: [
            { filePath: '/file1.ts', line: 1, column: 25 },
            { filePath: '/file1.ts', line: 1, column: 10 },
            { filePath: '/file2.ts', line: 1, column: 10 },
          ],
        },
      ]);
    });
  });
});
