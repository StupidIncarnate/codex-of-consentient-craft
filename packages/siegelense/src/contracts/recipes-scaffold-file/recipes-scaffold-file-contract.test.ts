import { RecipesScaffoldFileStub } from './recipes-scaffold-file.stub';
import { recipesScaffoldFileContract } from './recipes-scaffold-file-contract';

describe('recipesScaffoldFileContract', () => {
  describe('valid scaffold files', () => {
    it('VALID: {relativePath: "package.json", contents: "{}\\n"} => parses successfully', () => {
      const file = RecipesScaffoldFileStub({ relativePath: 'package.json', contents: '{}\n' });

      const result = recipesScaffoldFileContract.parse(file);

      expect(result).toStrictEqual({ relativePath: 'package.json', contents: '{}\n' });
    });

    it('VALID: {relativePath: "src/index.ts"} => accepts a nested relative path', () => {
      const file = RecipesScaffoldFileStub({ relativePath: 'src/index.ts' });

      const result = recipesScaffoldFileContract.parse(file);

      expect(result.relativePath).toBe('src/index.ts');
    });
  });

  describe('invalid scaffold files', () => {
    it('INVALID: {relativePath missing} => throws validation error', () => {
      expect(() => recipesScaffoldFileContract.parse({ contents: '{}\n' })).toThrow(/Required/u);
    });

    it('INVALID: {contents missing} => throws validation error', () => {
      expect(() => recipesScaffoldFileContract.parse({ relativePath: 'package.json' })).toThrow(
        /Required/u,
      );
    });
  });
});
