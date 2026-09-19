import { sessionWithNestedChainInputsContract } from './session-with-nested-chain-inputs-contract';
import { SessionWithNestedChainInputsStub } from './session-with-nested-chain-inputs.stub';

describe('sessionWithNestedChainInputsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildPath} => parses to exactly that field', () => {
      const result = sessionWithNestedChainInputsContract.parse({
        guildPath: '/tmp/guilds-under-test/guild-1',
      });

      expect(result).toStrictEqual({ guildPath: '/tmp/guilds-under-test/guild-1' });
    });

    it('VALID: {stub with guildPath override} => parses with the overridden path', () => {
      const result = SessionWithNestedChainInputsStub({ guildPath: '/tmp/guild-2' });

      expect(result.guildPath).toBe('/tmp/guild-2');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {guildPath: ""} => throws too_small', () => {
      expect(() => sessionWithNestedChainInputsContract.parse({ guildPath: '' })).toThrow(
        /too_small/u,
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => sessionWithNestedChainInputsContract.parse({})).toThrow(/Required/u);
    });
  });
});
