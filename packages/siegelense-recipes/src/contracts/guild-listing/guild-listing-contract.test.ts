import { guildListingContract } from './guild-listing-contract';
import { GuildListingStub } from './guild-listing.stub';

describe('guildListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {guilds: [one guild]} => parses to the complete listing', () => {
      const listing = GuildListingStub();

      expect(listing).toStrictEqual({
        guilds: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'My Guild',
            path: '/home/user/my-guild',
            urlSlug: 'my-guild',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      });
    });

    it('EMPTY: {guilds: []} => parses to an empty listing', () => {
      expect(guildListingContract.parse({ guilds: [] })).toStrictEqual({ guilds: [] });
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {guilds: [{}]} => throws', () => {
      expect(() => guildListingContract.parse({ guilds: [{}] })).toThrow(/Required/u);
    });

    it('INVALID: {a bare array} => throws', () => {
      expect(() => guildListingContract.parse([])).toThrow(/Expected object/u);
    });
  });
});
