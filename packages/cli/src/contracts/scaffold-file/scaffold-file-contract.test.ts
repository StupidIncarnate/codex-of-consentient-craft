import { scaffoldFileContract } from './scaffold-file-contract';
import { ScaffoldFileStub } from './scaffold-file.stub';

describe('scaffoldFileContract', () => {
  describe('valid inputs', () => {
    it('VALID: {relativePath: "package.json", contents: "{}\\n"} => parses successfully', () => {
      const result = scaffoldFileContract.parse({ relativePath: 'package.json', contents: '{}\n' });

      expect(result).toStrictEqual({ relativePath: 'package.json', contents: '{}\n' });
    });

    it('EMPTY: {contents: ""} => parses successfully with empty contents', () => {
      const result = scaffoldFileContract.parse({ relativePath: '.gitkeep', contents: '' });

      expect(result).toStrictEqual({ relativePath: '.gitkeep', contents: '' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing relativePath} => throws validation error', () => {
      expect(() => {
        return scaffoldFileContract.parse({ contents: '{}\n' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing contents} => throws validation error', () => {
      expect(() => {
        return scaffoldFileContract.parse({ relativePath: 'package.json' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {relativePath: 123} => throws validation error', () => {
      expect(() => {
        return scaffoldFileContract.parse({ relativePath: 123 as never, contents: '{}\n' });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {contents: 123} => throws validation error', () => {
      expect(() => {
        return scaffoldFileContract.parse({ relativePath: 'package.json', contents: 123 as never });
      }).toThrow(/Expected string/u);
    });
  });

  describe('ScaffoldFileStub', () => {
    it('VALID: {} => returns default stub', () => {
      const result = ScaffoldFileStub();

      expect(result).toStrictEqual({ relativePath: 'package.json', contents: '{}\n' });
    });
  });
});
