import { siegelenseCleanupInputContract } from './siegelense-cleanup-input-contract';
import { SiegelenseCleanupInputStub } from './siegelense-cleanup-input.stub';

describe('siegelenseCleanupInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {} => parses to an empty object', () => {
      expect(siegelenseCleanupInputContract.parse(SiegelenseCleanupInputStub())).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {instanceId} => throws Unrecognized key, cleanup takes no argument', () => {
      expect(() =>
        siegelenseCleanupInputContract.parse({ instanceId: 'inst_7f3a9c21' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
