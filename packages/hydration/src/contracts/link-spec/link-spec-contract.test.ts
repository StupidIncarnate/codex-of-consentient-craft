import { linkSpecContract } from './link-spec-contract';
import { LinkSpecStub } from './link-spec.stub';

describe('linkSpecContract', () => {
  describe('valid link specs', () => {
    it('VALID: {of: "guild", as: "guildId"} => returns {of: "guild", as: "guildId"}', () => {
      expect(LinkSpecStub({ of: 'guild', as: 'guildId' })).toStrictEqual({
        of: 'guild',
        as: 'guildId',
      });
    });

    it('VALID: {of: "session", as: "sessionId", from: "sessionId"} => returns all three', () => {
      expect(LinkSpecStub({ of: 'session', as: 'sessionId', from: 'sessionId' })).toStrictEqual({
        of: 'session',
        as: 'sessionId',
        from: 'sessionId',
      });
    });
  });

  describe('invalid link specs', () => {
    it('INVALID: {of: "guild"} => throws "Required"', () => {
      expect(() => linkSpecContract.parse({ of: 'guild' })).toThrow(/Required/u);
    });
  });
});
