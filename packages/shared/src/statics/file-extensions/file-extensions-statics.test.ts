import { fileExtensionsStatics } from './file-extensions-statics';

describe('fileExtensionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(fileExtensionsStatics).toStrictEqual({
      source: {
        typescript: ['.ts', '.tsx'],
        javascript: ['.js', '.jsx'],
        all: ['.ts', '.tsx', '.js', '.jsx'],
      },
      globs: {
        typescript: '*.{ts,tsx}',
        javascript: '*.{js,jsx}',
        all: '*.{ts,tsx,js,jsx}',
      },
    });
  });
});
