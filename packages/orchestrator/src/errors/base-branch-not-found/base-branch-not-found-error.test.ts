import { BaseBranchNotFoundError } from './base-branch-not-found-error';

describe('BaseBranchNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {} => sets name and frozen message', () => {
      const error = new BaseBranchNotFoundError();

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BaseBranchNotFoundError',
        message: 'No local main or master branch found',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseBranchNotFoundError);
    });
  });
});
