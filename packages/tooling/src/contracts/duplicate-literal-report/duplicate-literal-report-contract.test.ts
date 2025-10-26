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
});
