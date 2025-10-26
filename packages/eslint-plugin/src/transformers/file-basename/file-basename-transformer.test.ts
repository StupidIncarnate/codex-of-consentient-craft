import { fileBasenameTransformer } from './file-basename-transformer';

describe('fileBasenameTransformer', () => {
  it('VALID: {filename: "/path/to/user-fetch-broker.ts"} => returns "user-fetch-broker"', () => {
    expect(fileBasenameTransformer({ filename: '/path/to/user-fetch-broker.ts' })).toBe(
      'user-fetch-broker',
    );
  });

  it('VALID: {filename: "/project/src/contracts/user/user-contract.ts"} => returns "user-contract"', () => {
    expect(
      fileBasenameTransformer({ filename: '/project/src/contracts/user/user-contract.ts' }),
    ).toBe('user-contract');
  });

  it('VALID: {filename: "button-widget.tsx"} => returns "button-widget"', () => {
    expect(fileBasenameTransformer({ filename: 'button-widget.tsx' })).toBe('button-widget');
  });

  it('VALID: {filename: "format-date.js"} => returns "format-date"', () => {
    expect(fileBasenameTransformer({ filename: 'format-date.js' })).toBe('format-date');
  });

  it('VALID: {filename: "api-client.jsx"} => returns "api-client"', () => {
    expect(fileBasenameTransformer({ filename: 'api-client.jsx' })).toBe('api-client');
  });

  it('EDGE: {filename: "file.ts"} => returns "file"', () => {
    expect(fileBasenameTransformer({ filename: 'file.ts' })).toBe('file');
  });

  it('EDGE: {filename: "no-extension"} => returns "no-extension"', () => {
    expect(fileBasenameTransformer({ filename: 'no-extension' })).toBe('no-extension');
  });

  it('ERROR: {filename: "/path/to/.ts"} => throws ZodError (empty basename)', () => {
    expect(() => {
      return fileBasenameTransformer({ filename: '/path/to/.ts' });
    }).toThrow('Filename cannot be empty');
  });

  it('ERROR: {filename: ""} => throws ZodError (empty filename)', () => {
    expect(() => {
      return fileBasenameTransformer({ filename: '' });
    }).toThrow('Filename cannot be empty');
  });
});
