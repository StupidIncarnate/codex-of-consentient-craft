import { guildAbsolutePathInputContract } from './guild-absolute-path-input-contract';
import { GuildAbsolutePathInputStub } from './guild-absolute-path-input.stub';

describe('guildAbsolutePathInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: default stub => parses the unix absolute path', () => {
      const result = GuildAbsolutePathInputStub();

      expect(result.path).toBe('/projects/guild');
    });

    it('VALID: {path: "C:\\\\work\\\\guild"} => parses the windows absolute path', () => {
      const result = guildAbsolutePathInputContract.parse({ path: 'C:\\work\\guild' });

      expect(result.path).toBe('C:\\work\\guild');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: "jo"} => fails', () => {
      const result = guildAbsolutePathInputContract.safeParse({ path: 'jo' });

      expect(result.success).toBe(false);
    });

    it('INVALID: {path: "../guild"} => fails', () => {
      const result = guildAbsolutePathInputContract.safeParse({ path: '../guild' });

      expect(result.success).toBe(false);
    });

    it('INVALID: {path: ""} => fails', () => {
      const result = guildAbsolutePathInputContract.safeParse({ path: '' });

      expect(result.success).toBe(false);
    });
  });
});
