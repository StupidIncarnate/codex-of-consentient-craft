import { fileExtensionExtractTransformer } from './file-extension-extract-transformer';

describe('fileExtensionExtractTransformer', () => {
  it("VALID: {filePath: 'file.txt'} => returns '.txt'", () => {
    expect(fileExtensionExtractTransformer({ filePath: 'file.txt' })).toBe('.txt');
  });

  it("VALID: {filePath: 'path/file.js'} => returns '.js'", () => {
    expect(fileExtensionExtractTransformer({ filePath: 'path/file.js' })).toBe('.js');
  });

  it("VALID: {filePath: 'file.test.ts'} => returns '.ts'", () => {
    expect(fileExtensionExtractTransformer({ filePath: 'file.test.ts' })).toBe('.ts');
  });

  it("EDGE: {filePath: 'file'} => returns ''", () => {
    expect(fileExtensionExtractTransformer({ filePath: 'file' })).toBe('');
  });

  it("EDGE: {filePath: 'file.'} => returns '.'", () => {
    expect(fileExtensionExtractTransformer({ filePath: 'file.' })).toBe('.');
  });

  it("EDGE: {filePath: '.gitignore'} => returns '.gitignore'", () => {
    expect(fileExtensionExtractTransformer({ filePath: '.gitignore' })).toBe('.gitignore');
  });
});
