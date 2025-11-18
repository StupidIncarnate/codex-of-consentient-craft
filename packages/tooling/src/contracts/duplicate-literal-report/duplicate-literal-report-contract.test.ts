import { duplicateLiteralReportContract as _duplicateLiteralReportContract } from './duplicate-literal-report-contract';
import { DuplicateLiteralReportStub } from './duplicate-literal-report.stub';
import { LiteralValueStub } from '../literal-value/literal-value.stub';
import { LiteralTypeStub } from '../literal-type/literal-type.stub';
import { LiteralOccurrenceStub } from '../literal-occurrence/literal-occurrence.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('duplicateLiteralReportContract', () => {
  it('VALID: {value, type, occurrences, count: 2} => parses successfully', () => {
    const value = LiteralValueStub({ value: 'test' });
    const type = LiteralTypeStub({ value: 'string' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
    const occurrences = [
      LiteralOccurrenceStub({ filePath, line: 1, column: 0 }),
      LiteralOccurrenceStub({ filePath, line: 10, column: 5 }),
    ];

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 2 });

    expect(result).toStrictEqual({
      value: 'test',
      type: 'string',
      occurrences: [
        { filePath: '/file.ts', line: 1, column: 0 },
        { filePath: '/file.ts', line: 10, column: 5 },
      ],
      count: 2,
    });
  });

  it('VALID: {value, type: "regex", occurrences, count: 5} => parses successfully', () => {
    const value = LiteralValueStub({ value: '/test/g' });
    const type = LiteralTypeStub({ value: 'regex' });
    const filePath1 = AbsoluteFilePathStub({ value: '/file1.ts' });
    const filePath2 = AbsoluteFilePathStub({ value: '/file2.ts' });
    const occurrences = [
      LiteralOccurrenceStub({ filePath: filePath1, line: 1, column: 0 }),
      LiteralOccurrenceStub({ filePath: filePath1, line: 5, column: 2 }),
      LiteralOccurrenceStub({ filePath: filePath2, line: 3, column: 10 }),
      LiteralOccurrenceStub({ filePath: filePath2, line: 8, column: 0 }),
      LiteralOccurrenceStub({ filePath: filePath2, line: 15, column: 4 }),
    ];

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 5 });

    expect(result).toStrictEqual({
      value: '/test/g',
      type: 'regex',
      occurrences: [
        { filePath: '/file1.ts', line: 1, column: 0 },
        { filePath: '/file1.ts', line: 5, column: 2 },
        { filePath: '/file2.ts', line: 3, column: 10 },
        { filePath: '/file2.ts', line: 8, column: 0 },
        { filePath: '/file2.ts', line: 15, column: 4 },
      ],
      count: 5,
    });
  });

  it('VALID: {value, type, occurrences, count: 150} => parses successfully', () => {
    const value = LiteralValueStub({ value: 'error' });
    const type = LiteralTypeStub({ value: 'string' });
    const filePath = AbsoluteFilePathStub({ value: '/large/file.ts' });
    const occurrences = Array.from({ length: 150 }, (_, i) => {
      return LiteralOccurrenceStub({ filePath, line: i + 1, column: 0 });
    });

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 150 });

    expect(result).toStrictEqual({
      value: 'error',
      type: 'string',
      occurrences: occurrences.map((_occ, i) => {
        return {
          filePath: '/large/file.ts',
          line: i + 1,
          column: 0,
        };
      }),
      count: 150,
    });
  });

  it('VALID: {value: "", type, occurrences, count: 3} => parses successfully', () => {
    const value = LiteralValueStub({ value: '' });
    const type = LiteralTypeStub({ value: 'string' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
    const occurrences = [
      LiteralOccurrenceStub({ filePath, line: 1, column: 0 }),
      LiteralOccurrenceStub({ filePath, line: 2, column: 0 }),
      LiteralOccurrenceStub({ filePath, line: 3, column: 0 }),
    ];

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 3 });

    expect(result).toStrictEqual({
      value: '',
      type: 'string',
      occurrences: [
        { filePath: '/file.ts', line: 1, column: 0 },
        { filePath: '/file.ts', line: 2, column: 0 },
        { filePath: '/file.ts', line: 3, column: 0 },
      ],
      count: 3,
    });
  });

  it('VALID: {value: very long string, type, occurrences, count: 2} => parses successfully', () => {
    const longValue = 'a'.repeat(5000);
    const value = LiteralValueStub({ value: longValue });
    const type = LiteralTypeStub({ value: 'string' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
    const occurrences = [
      LiteralOccurrenceStub({ filePath, line: 1, column: 0 }),
      LiteralOccurrenceStub({ filePath, line: 10, column: 5 }),
    ];

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 2 });

    expect(result).toStrictEqual({
      value: longValue,
      type: 'string',
      occurrences: [
        { filePath: '/file.ts', line: 1, column: 0 },
        { filePath: '/file.ts', line: 10, column: 5 },
      ],
      count: 2,
    });
  });

  it('VALID: {value: "special!@#$%chars", type, occurrences, count: 2} => parses successfully', () => {
    const value = LiteralValueStub({ value: 'special!@#$%chars' });
    const type = LiteralTypeStub({ value: 'string' });
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
    const occurrences = [
      LiteralOccurrenceStub({ filePath, line: 1, column: 0 }),
      LiteralOccurrenceStub({ filePath, line: 5, column: 10 }),
    ];

    const result = DuplicateLiteralReportStub({ value, type, occurrences, count: 2 });

    expect(result).toStrictEqual({
      value: 'special!@#$%chars',
      type: 'string',
      occurrences: [
        { filePath: '/file.ts', line: 1, column: 0 },
        { filePath: '/file.ts', line: 5, column: 10 },
      ],
      count: 2,
    });
  });
});
