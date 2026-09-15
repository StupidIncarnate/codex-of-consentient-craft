import { siegelenseKillInputContract } from './siegelense-kill-input-contract';
import { SiegelenseKillInputStub } from './siegelense-kill-input.stub';

describe('siegelenseKillInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {instanceId} => parses successfully', () => {
      expect(siegelenseKillInputContract.parse(SiegelenseKillInputStub())).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing instanceId} => throws validation error', () => {
      expect(() => siegelenseKillInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: malformed} => throws validation error', () => {
      expect(() => siegelenseKillInputContract.parse({ instanceId: 'not-an-instance-id' })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {reason} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        siegelenseKillInputContract.parse({
          instanceId: 'inst_7f3a9c21',
          reason: 'done testing',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
