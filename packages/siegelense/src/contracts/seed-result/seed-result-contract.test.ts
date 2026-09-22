import { seedResultContract } from './seed-result-contract';
import { SeedResultStub } from './seed-result.stub';

describe('seedResultContract', () => {
  describe('valid result', () => {
    it('VALID: {standard stub} => parses the full saved row a real recipe produces', () => {
      expect(SeedResultStub()).toStrictEqual({
        guild: {
          id: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
          name: 'Siege Guild',
          path: '/tmp/dm-siege-inst_seed/siege-repo',
          urlSlug: 'siege-guild',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      });
    });

    it('VALID: {a bare id value} => parses a flat ContentText binding too', () => {
      expect(seedResultContract.parse({ guildSlug: 'siege-guild' })).toStrictEqual({
        guildSlug: 'siege-guild',
      });
    });

    it('VALID: {a recipe with several saved rows} => parses every one of them', () => {
      const result = seedResultContract.parse({
        guild: { id: 'g1', urlSlug: 'siege-guild' },
        questCreated: { id: 'q1', status: 'created' },
        questInProgress: { id: 'q2', status: 'in_progress' },
        questComplete: { id: 'q3', status: 'complete' },
      });

      expect(result).toStrictEqual({
        guild: { id: 'g1', urlSlug: 'siege-guild' },
        questCreated: { id: 'q1', status: 'created' },
        questInProgress: { id: 'q2', status: 'in_progress' },
        questComplete: { id: 'q3', status: 'complete' },
      });
    });

    it('VALID: {empty result} => parses to an empty object', () => {
      expect(seedResultContract.parse({})).toStrictEqual({});
    });
  });

  describe('invalid result', () => {
    it('INVALID: {a number value, neither an id nor a saved row} => throws', () => {
      expect(() => seedResultContract.parse({ guildSlug: 123 })).toThrow(/Expected string/u);
    });
  });
});
