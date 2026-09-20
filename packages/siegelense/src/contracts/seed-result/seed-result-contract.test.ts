import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { seedResultContract } from './seed-result-contract';
import { SeedResultStub } from './seed-result.stub';

describe('seedResultContract', () => {
  describe('valid result', () => {
    it('VALID: {standard stub} => parses to the complete map', () => {
      expect(SeedResultStub()).toStrictEqual({
        guildId: ContentTextStub({ value: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41' }),
        guildSlug: ContentTextStub({ value: 'siege-guild' }),
        questId: ContentTextStub({ value: 'bbbbbbbb-2222-4222-8222-222222222222' }),
      });
    });

    it('VALID: {empty result} => parses to an empty object', () => {
      expect(seedResultContract.parse({})).toStrictEqual({});
    });
  });

  describe('invalid result', () => {
    it('INVALID: {non-string value} => throws', () => {
      expect(() => seedResultContract.parse({ guildSlug: 123 })).toThrow(/Expected string/u);
    });
  });
});
