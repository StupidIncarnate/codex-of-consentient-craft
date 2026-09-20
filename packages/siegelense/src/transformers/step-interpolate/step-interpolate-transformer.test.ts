import { SeedBindingsStub } from '../../contracts/seed-bindings/seed-bindings.stub';
import { StepStub } from '../../contracts/step/step.stub';
import { stepInterpolateTransformer } from './step-interpolate-transformer';

describe('stepInterpolateTransformer', () => {
  describe('substitution', () => {
    it('VALID: {goto /{g.guildSlug}} => the path reads the bound slug', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'goto', path: '/{g.guildSlug}' }),
        bindings: SeedBindingsStub(),
      });

      expect(result).toStrictEqual({
        step: 'goto',
        path: '/siege-guild',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {a dotted field} => the whole value is the bound route', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'goto', path: '{s.sessions.nested}' }),
        bindings: SeedBindingsStub({
          s: { 'sessions.nested': '/siege-guild/session/sess-1' },
        }),
      });

      expect(result).toStrictEqual({
        step: 'goto',
        path: '/siege-guild/session/sess-1',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {two placeholders in one string} => both are substituted', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'goto', path: '/{g.guildSlug}/quest/{g.questId}' }),
        bindings: SeedBindingsStub(),
      });

      expect(result).toStrictEqual({
        step: 'goto',
        path: '/siege-guild/quest/bbbbbbbb-2222-4222-8222-222222222222',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {a seed step whose parameter carries a placeholder} => the parameter is substituted', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({
          step: 'seed',
          recipe: 'session-with-nested-subagent',
          as: 's',
          params: {
            guild: '{g.guildId}',
          },
        }),
        bindings: SeedBindingsStub(),
      });

      expect(result).toStrictEqual({
        step: 'seed',
        recipe: 'session-with-nested-subagent',
        as: 's',
        params: {
          guild: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
        },
        node: null,
        expect: 'ok',
      });
    });
  });

  describe('steps that carry no placeholder', () => {
    it('VALID: {a plain goto} => comes back unchanged', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'goto', path: '/queue' }),
        bindings: SeedBindingsStub(),
      });

      expect(result).toStrictEqual({ step: 'goto', path: '/queue', node: null, expect: 'ok' });
    });

    it("VALID: {an eval source holding a JS block} => the block's braces are left alone", () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'eval', source: '(() => { return 1 })()' }),
        bindings: SeedBindingsStub(),
      });

      expect(result).toStrictEqual({
        step: 'eval',
        source: '(() => { return 1 })()',
        node: null,
        expect: 'ok',
      });
    });

    it('EMPTY: {no bindings and no placeholder} => comes back unchanged', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'goto', path: '/' }),
        bindings: {},
      });

      expect(result).toStrictEqual({ step: 'goto', path: '/', node: null, expect: 'ok' });
    });
  });

  describe('refusals', () => {
    it('ERROR: {an unbound binding name} => throws naming the placeholder and listing what IS bound', () => {
      expect(() =>
        stepInterpolateTransformer({
          step: StepStub({ step: 'goto', path: '/{q.questId}' }),
          bindings: SeedBindingsStub(),
        }),
      ).toThrow(
        'UNKNOWN BINDING: {q.questId} cannot be resolved — bound in this batch: g. A binding is minted by a { "step": "seed", "recipe": "…", "as": "q" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      );
    });

    it('ERROR: {a bound name with a misspelled field} => throws listing what that binding holds', () => {
      expect(() =>
        stepInterpolateTransformer({
          step: StepStub({ step: 'goto', path: '/{g.guildSlugg}' }),
          bindings: SeedBindingsStub(),
        }),
      ).toThrow(
        'UNKNOWN BINDING: {g.guildSlugg} cannot be resolved — bound in this batch: g. "g" holds: guildId, guildSlug, questId. A binding is minted by a { "step": "seed", "recipe": "…", "as": "g" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      );
    });

    it('ERROR: {a placeholder with nothing bound at all} => throws saying so', () => {
      expect(() =>
        stepInterpolateTransformer({
          step: StepStub({ step: 'goto', path: '/{g.guildSlug}' }),
          bindings: {},
        }),
      ).toThrow(/no `seed` step in this batch has bound anything yet/u);
    });
  });

  describe('values that would break the document they land in', () => {
    it('EDGE: {an id carrying a quote} => is JSON-escaped rather than terminating the string', () => {
      const result = stepInterpolateTransformer({
        step: StepStub({ step: 'eval', source: 'x = "{g.guildSlug}"' }),
        bindings: SeedBindingsStub({ g: { guildSlug: 'sie"ge\\guild' } }),
      });

      expect(result).toStrictEqual({
        step: 'eval',
        source: 'x = "sie"ge\\guild"',
        node: null,
        expect: 'ok',
      });
    });
  });
});
