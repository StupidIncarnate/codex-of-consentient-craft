import { hasExportedFunctionGuard } from './has-exported-function-guard';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('hasExportedFunctionGuard', () => {
  describe('with export const', () => {
    it('VALID: {fileContents: "export const foo = () => {}"} => returns true', () => {
      const fileContents = FileContentsStub({ value: 'export const foo = () => {}' });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(true);
    });

    it('VALID: {fileContents: "export const myFunction = async () => {}"} => returns true', () => {
      const fileContents = FileContentsStub({
        value: 'export const myFunction = async () => {}',
      });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(true);
    });

    it('VALID: {fileContents: "  export const  indented = () => {}"} => returns true', () => {
      const fileContents = FileContentsStub({
        value: '  export const  indented = () => {}',
      });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(true);
    });
  });

  describe('without export const', () => {
    it('EMPTY: {fileContents: "const foo = () => {}"} => returns false', () => {
      const fileContents = FileContentsStub({ value: 'const foo = () => {}' });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('EMPTY: {fileContents: "export function bar() {}"} => returns false', () => {
      const fileContents = FileContentsStub({ value: 'export function bar() {}' });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('EMPTY: {fileContents: "export default foo"} => returns false', () => {
      const fileContents = FileContentsStub({ value: 'export default foo' });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('EMPTY: {fileContents: ""} => returns false', () => {
      const fileContents = FileContentsStub({ value: '' });

      const result = hasExportedFunctionGuard({ fileContents });

      expect(result).toBe(false);
    });
  });

  describe('without fileContents', () => {
    it('EMPTY: {} => returns false', () => {
      const result = hasExportedFunctionGuard({});

      expect(result).toBe(false);
    });
  });
});
