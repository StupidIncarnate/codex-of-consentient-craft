import { createWorktreeInputContract } from './create-worktree-input-contract';
import { CreateWorktreeInputStub } from './create-worktree-input.stub';

describe('createWorktreeInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name} => parses successfully', () => {
      expect(createWorktreeInputContract.parse(CreateWorktreeInputStub())).toStrictEqual({
        name: 'probe',
      });
    });

    it('VALID: {name: "quest-add-auth"} => keeps the caller name verbatim', () => {
      expect(
        createWorktreeInputContract.parse(CreateWorktreeInputStub({ name: 'quest-add-auth' })),
      ).toStrictEqual({ name: 'quest-add-auth' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing name} => throws, there is no default worktree', () => {
      expect(() => createWorktreeInputContract.parse({})).toThrow(/Required/u);
    });

    it('EMPTY: {name: ""} => throws validation error', () => {
      expect(() => createWorktreeInputContract.parse({ name: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {path} => throws Unrecognized key, a caller never chooses the location', () => {
      expect(() =>
        createWorktreeInputContract.parse({ name: 'probe', path: '/tmp/elsewhere' } as never),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {name: 7} => throws, the name is a string', () => {
      expect(() => createWorktreeInputContract.parse({ name: 7 as never })).toThrow(
        /Expected string/u,
      );
    });
  });
});
