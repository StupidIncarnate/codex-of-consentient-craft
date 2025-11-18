import { z } from 'zod';
import { eslintContextContract } from './eslint-context-contract';
import { EslintContextStub } from './eslint-context.stub';

describe('EslintContextStub', () => {
  it('VALID: {} => returns default EslintContext', () => {
    eslintContextContract.safeParse({});
    const result = EslintContextStub();

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: expect.any(Function),
      getFilename: expect.any(Function),
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
      sourceCode: {
        text: '',
        ast: {},
        getAncestors: expect.any(Function),
        getAllComments: expect.any(Function),
        getText: expect.any(Function),
      },
    });
  });

  it('VALID: getFilename function => returns branded Filename', () => {
    const filenameContract = z.string().brand<'Filename'>();
    const result = EslintContextStub();

    expect(result.getFilename?.()).toStrictEqual(filenameContract.parse('/test/file.ts'));
  });

  it('VALID: getScope function => returns EslintScope', () => {
    const result = EslintContextStub();

    expect(result.getScope?.()).toStrictEqual({
      type: 'global',
      variables: [],
    });
  });

  it('VALID: getSourceCode function => returns EslintSourceCode', () => {
    const result = EslintContextStub();

    expect(result.getSourceCode?.()).toStrictEqual({
      text: '',
      ast: {},
      getAncestors: expect.any(Function),
      getAllComments: expect.any(Function),
      getText: expect.any(Function),
    });
  });

  it('VALID: {report: customFn} => returns context with custom report function', () => {
    const customReport = (): boolean => {
      return true;
    };
    const result = EslintContextStub({ report: customReport });

    expect(result).toStrictEqual({
      filename: '/test/file.ts',
      report: customReport,
      getFilename: expect.any(Function),
      getScope: expect.any(Function),
      getSourceCode: expect.any(Function),
      sourceCode: {
        text: '',
        ast: {},
        getAncestors: expect.any(Function),
        getAllComments: expect.any(Function),
        getText: expect.any(Function),
      },
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
      sourceCode: {
        text: '',
        ast: {},
        getAncestors: expect.any(Function),
        getAllComments: expect.any(Function),
        getText: expect.any(Function),
      },
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
      sourceCode: {
        text: '',
        ast: {},
        getAncestors: expect.any(Function),
        getAllComments: expect.any(Function),
        getText: expect.any(Function),
      },
    });
  });
});
