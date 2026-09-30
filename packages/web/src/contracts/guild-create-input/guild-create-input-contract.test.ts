import { guildCreateInputContract } from './guild-create-input-contract';
import { GuildCreateInputStub } from './guild-create-input.stub';

describe('guildCreateInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {path: "/home/user/jo"} => parses the Unix absolute path', () => {
      const result = guildCreateInputContract.parse(
        GuildCreateInputStub({ path: '/home/user/jo' as never }),
      );

      expect(result).toStrictEqual({ path: '/home/user/jo' });
    });

    it('VALID: {path: "C:\\\\work\\\\jo"} => parses the Windows absolute path', () => {
      const result = guildCreateInputContract.parse({ path: 'C:\\work\\jo' });

      expect(result).toStrictEqual({ path: 'C:\\work\\jo' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: "jo"} => throws the absolute-path message', () => {
      expect(() => guildCreateInputContract.parse({ path: 'jo' })).toThrow(
        /Path must be absolute \(start with \/ or C:\\\\ on Windows\)/u,
      );
    });

    it('INVALID: {path: ""} => throws on the empty path', () => {
      expect(() => guildCreateInputContract.parse({ path: '' })).toThrow(/too_small/u);
    });
  });
});
