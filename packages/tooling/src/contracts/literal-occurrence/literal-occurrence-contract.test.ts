import { literalOccurrenceContract as _literalOccurrenceContract } from './literal-occurrence-contract';
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

  it('VALID: {filePath, line: 1000000, column: 1000000} => parses successfully', () => {
    const filePath = AbsoluteFilePathStub({ value: '/very/long/file.ts' });
    const result = LiteralOccurrenceStub({ filePath, line: 1000000, column: 1000000 });

    expect(result).toStrictEqual({
      filePath: '/very/long/file.ts',
      line: 1000000,
      column: 1000000,
    });
  });

  it('VALID: {filePath, line: MAX_SAFE_INTEGER, column: MAX_SAFE_INTEGER} => parses successfully', () => {
    const filePath = AbsoluteFilePathStub({ value: '/edge/case/file.ts' });
    const result = LiteralOccurrenceStub({
      filePath,
      line: Number.MAX_SAFE_INTEGER,
      column: Number.MAX_SAFE_INTEGER,
    });

    expect(result).toStrictEqual({
      filePath: '/edge/case/file.ts',
      line: Number.MAX_SAFE_INTEGER,
      column: Number.MAX_SAFE_INTEGER,
    });
  });

  it('VALID: {filePath: "/", line: 1, column: 0} => parses successfully', () => {
    const filePath = AbsoluteFilePathStub({ value: '/' });
    const result = LiteralOccurrenceStub({ filePath, line: 1, column: 0 });

    expect(result).toStrictEqual({
      filePath: '/',
      line: 1,
      column: 0,
    });
  });

  it('VALID: {filePath: very long path, line: 1, column: 0} => parses successfully', () => {
    const longPath = `${'/very/long/path/that/has/many/segments/'.repeat(10)}file.ts`;
    const filePath = AbsoluteFilePathStub({ value: longPath });
    const result = LiteralOccurrenceStub({ filePath, line: 1, column: 0 });

    expect(result).toStrictEqual({
      filePath: longPath,
      line: 1,
      column: 0,
    });
  });
});
