import { fileUtilGetFileExtension } from './file-util-get-extension';

describe('fileUtilGetFileExtension', () => {
  it("VALID: {filePath: 'file.txt'} => returns '.txt'", () => {
    expect(fileUtilGetFileExtension({ filePath: 'file.txt' })).toBe('.txt');
  });

  it("VALID: {filePath: 'path/file.js'} => returns '.js'", () => {
    expect(fileUtilGetFileExtension({ filePath: 'path/file.js' })).toBe('.js');
  });

  it("VALID: {filePath: 'file.test.ts'} => returns '.ts'", () => {
    expect(fileUtilGetFileExtension({ filePath: 'file.test.ts' })).toBe('.ts');
  });

  it("EDGE: {filePath: 'file'} => returns ''", () => {
    expect(fileUtilGetFileExtension({ filePath: 'file' })).toBe('');
  });

  it("EDGE: {filePath: 'file.'} => returns '.'", () => {
    expect(fileUtilGetFileExtension({ filePath: 'file.' })).toBe('.');
  });

  it("EDGE: {filePath: '.gitignore'} => returns '.gitignore'", () => {
    expect(fileUtilGetFileExtension({ filePath: '.gitignore' })).toBe('.gitignore');
  });
});
