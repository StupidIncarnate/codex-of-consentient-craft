import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astFieldListOwnersTransformer } from './ast-field-list-owners-transformer';

describe('astFieldListOwnersTransformer', () => {
  describe('a local field list spread into an owner', () => {
    it('VALID: {...treeNodeFields.shape in treeNodeContract} => maps the list to its owner', () => {
      const program = ProgramStub({
        code: 'const treeNodeFields;\nexport const treeNodeContract = f({ ...treeNodeFields.shape });',
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([['treeNodeFields', 'treeNodeContract']]);
    });
  });

  describe('a spread that is not a local field list', () => {
    it('EMPTY: {the spread names an imported const} => returns an empty map', () => {
      const program = ProgramStub({
        code: 'const treeNodeFields;\nexport const treeNodeContract = f({ ...importedFields.shape });',
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {the spread reads a member other than shape} => returns an empty map', () => {
      const program = ProgramStub({
        code: 'const treeNodeFields;\nexport const treeNodeContract = f({ ...treeNodeFields.options });',
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {no owner spreads anything} => returns an empty map', () => {
      const program = ProgramStub({ code: 'const treeNodeFields;\nexport const plainContract;' });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });
  });
});
