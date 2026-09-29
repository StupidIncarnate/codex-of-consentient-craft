import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astLocalIdConstsTransformer } from './ast-local-id-consts-transformer';

describe('astLocalIdConstsTransformer', () => {
  describe('a local const used as an owner id', () => {
    it('VALID: {id: workItemId in workItemContract} => maps the const to its owner', () => {
      const program = ProgramStub({
        code: 'const workItemId;\nexport const workItemContract = f({ id: workItemId });',
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([['workItemId', 'workItemContract']]);
    });
  });

  describe('a local const that is not an owner id', () => {
    it('EMPTY: {mintedBy: workItemId} => the key is not id, so nothing maps', () => {
      const program = ProgramStub({
        code: 'const workItemId;\nexport const workItemContract = f({ mintedBy: workItemId });',
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {id: importedId} => the value is not a local const, so nothing maps', () => {
      const program = ProgramStub({
        code: 'const workItemId;\nexport const workItemContract = f({ id: importedId });',
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });
  });
});
