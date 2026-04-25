import { GuildNotFoundError } from './guild-not-found-error';

describe('GuildNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {guildId: uuid string} => sets name and id-suffixed message', () => {
      const error = new GuildNotFoundError({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildNotFoundError',
        message: 'Guild not found: f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GuildNotFoundError);
    });

    it('EDGE: {guildId: ""} => message ends with the colon-space prefix and nothing else', () => {
      const error = new GuildNotFoundError({ guildId: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildNotFoundError',
        message: 'Guild not found: ',
      });
    });
  });
});
