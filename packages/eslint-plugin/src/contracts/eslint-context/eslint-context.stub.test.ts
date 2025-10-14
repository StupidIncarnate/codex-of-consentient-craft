import { z } from 'zod';
import { EslintContextStub } from './eslint-context.stub';

describe('EslintContextStub', () => {
  it('VALID: {} => returns default EslintContext', () => {
    const result = EslintContextStub();

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: expect.any(Function),
      getFilename: expect.any(Function),
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
    });
  });

  it('VALID: report function => returns true', () => {
    const result = EslintContextStub();

    expect(result.report()).toBe(true);
  });

  it('VALID: getFilename function => returns branded Filename', () => {
    const filenameContract = z.string().brand<'Filename'>();
    const result = EslintContextStub();

    expect(result.getFilename?.()).toStrictEqual(filenameContract.parse('/test/file.ts'));
  });

  it('VALID: getScope function => returns object', () => {
    const result = EslintContextStub();

    expect(result.getScope?.()).toStrictEqual({});
  });

  it('VALID: getSourceCode function => returns object', () => {
    const result = EslintContextStub();

    expect(result.getSourceCode?.()).toStrictEqual({});
  });

  it('VALID: {report: customFn} => returns context with custom report function', () => {
    const customReport = (): string => {
      return 'custom';
    };
    const result = EslintContextStub({ report: customReport });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: customReport,
      getFilename: expect.any(Function),
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
    });
  });

  it('VALID: {getFilename: customFn} => returns context with custom getFilename function', () => {
    const filenameContract = z.string().brand<'Filename'>();
    const customGetFilename = () => {
      return filenameContract.parse('/custom/file.ts');
    };
    const result = EslintContextStub({ getFilename: customGetFilename });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: expect.any(Function),
      getFilename: customGetFilename,
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
    });
  });

  it('VALID: {getScope: customFn} => returns context with custom getScope function', () => {
    const customGetScope = (): string => {
      return 'custom-scope';
    };
    const result = EslintContextStub({ getScope: customGetScope });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: expect.any(Function),
      getFilename: expect.any(Function),
      getScope: customGetScope,
      getSourceCode: expect.any(Function),
    });
  });

  it('VALID: {getSourceCode: customFn} => returns context with custom getSourceCode function', () => {
    const customGetSourceCode = (): string => {
      return 'custom-source';
    };
    const result = EslintContextStub({ getSourceCode: customGetSourceCode });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: expect.any(Function),
      getFilename: expect.any(Function),
      getScope: expect.any(Function),
      getSourceCode: customGetSourceCode,
    });
  });

  it('VALID: {report: customReport, getFilename: customGetFilename} => returns context with multiple overrides', () => {
    const filenameContract = z.string().brand<'Filename'>();
    const customReport = (): boolean => {
      return false;
    };
    const customGetFilename = () => {
      return filenameContract.parse('/custom/path.ts');
    };
    const result = EslintContextStub({
      report: customReport,
      getFilename: customGetFilename,
    });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: customReport,
      getFilename: customGetFilename,
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
    });
  });
});
