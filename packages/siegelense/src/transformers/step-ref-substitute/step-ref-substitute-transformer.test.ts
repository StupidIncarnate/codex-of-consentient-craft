import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { stepRefSubstituteTransformer } from './step-ref-substitute-transformer';

describe('stepRefSubstituteTransformer', () => {
  describe('text without references', () => {
    it('VALID: {text with no braces} => returns original text unchanged', () => {
      const text = ContentTextStub({ value: '/guilds/all' });

      const result = stepRefSubstituteTransformer({
        text,
        outputs: {},
      });

      expect(result).toBe('/guilds/all');
    });
  });

  describe('text with a single reference', () => {
    it('VALID: {text with single reference} => substitutes reference with resolved value', () => {
      const text = ContentTextStub({ value: '/{g.guild.urlSlug}' });

      const result = stepRefSubstituteTransformer({
        text,
        outputs: {
          g: {
            guild: {
              urlSlug: 'siege-guild',
            },
          },
        },
      });

      expect(result).toBe('/siege-guild');
    });
  });

  describe('text with multiple references', () => {
    it('VALID: {text with multiple references} => substitutes all references', () => {
      const text = ContentTextStub({ value: '/{g.guild.urlSlug}/quests/{q.quest.id}' });

      const result = stepRefSubstituteTransformer({
        text,
        outputs: {
          g: {
            guild: {
              urlSlug: 'siege-guild',
            },
          },
          q: {
            quest: {
              id: 'q-123',
            },
          },
        },
      });

      expect(result).toBe('/siege-guild/quests/q-123');
    });
  });

  describe('unclosed brace in text', () => {
    it('VALID: {text with unclosed brace} => keeps literal text', () => {
      const text = ContentTextStub({ value: '/guilds/{unclosed' });

      const result = stepRefSubstituteTransformer({
        text,
        outputs: { g: { guild: { urlSlug: 'siege' } } },
      });

      expect(result).toBe('/guilds/{unclosed');
    });
  });

  describe('empty outputs with reference', () => {
    it('INVALID: {outputs empty, reference present} => throws nothing has been named yet error', () => {
      const text = ContentTextStub({ value: '/{g.guild.urlSlug}' });

      expect(() =>
        stepRefSubstituteTransformer({
          text,
          outputs: {},
        }),
      ).toThrow('cannot resolve reference {g.guild.urlSlug} — nothing has been named yet');
    });
  });

  describe('unknown step reference', () => {
    it('INVALID: {step not found in outputs} => throws error from stepRefResolveTransformer', () => {
      const text = ContentTextStub({ value: '/{missing.guild.urlSlug}' });

      expect(() =>
        stepRefSubstituteTransformer({
          text,
          outputs: { g: { guild: { urlSlug: 'siege' } } },
        }),
      ).toThrow('Step reference "{missing.guild.urlSlug}" names step "missing"');
    });
  });
});
