import { LiteralOccurrenceStub } from './literal-occurrence.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('literalOccurrenceContract', () => {
  it('VALID: {filePath, line: 1, column: 0} => parses successfully', () => {
    const filePath = AbsoluteFilePathStub({ value: '/home/user/file.ts' });
    const result = LiteralOccurrenceStub({ filePath, line: 1, column: 0 });

    expect(result).toStrictEqual({
      filePath: '/home/user/file.ts',
      line: 1,
      column: 0,
    });
  });

  it('VALID: {filePath, line: 42, column: 15} => parses successfully', () => {
    const filePath = AbsoluteFilePathStub({ value: '/src/test.ts' });
    const result = LiteralOccurrenceStub({ filePath, line: 42, column: 15 });

    expect(result).toStrictEqual({
      filePath: '/src/test.ts',
      line: 42,
      column: 15,
    });
  });
});
