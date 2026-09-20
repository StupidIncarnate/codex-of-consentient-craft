import { stepRefResolveTransformer } from './step-ref-resolve-transformer';

describe('stepRefResolveTransformer', () => {
  describe('a resolvable reference', () => {
    it('VALID: {outputs holding g.guild.id, ref "{g.guild.id}"} => resolves to that id', () => {
      const result = stepRefResolveTransformer({
        ref: '{g.guild.id}',
        outputs: { g: { guild: { id: 'g_1', urlSlug: 'the-guild' } } },
      });

      expect(result).toBe('g_1');
    });
  });

  describe('a two-segment reference', () => {
    it('INVALID: {ref "{g.guildId}", step g saved row guild} => throws naming the step and listing the rows it saved', () => {
      expect(() =>
        stepRefResolveTransformer({
          ref: '{g.guildId}',
          outputs: { g: { guild: { id: 'g_1' } } },
        }),
      ).toThrow(
        'Step reference "{g.guildId}" has two segments — "as:" names a STEP\'s output, and a step\'s output holds one or more ROWS, so a reference always has three: {step.row.field}. Step "g" saved: guild.',
      );
    });
  });

  describe('a reference naming a step that does not exist', () => {
    it('INVALID: {ref "{zzz.guild.id}", only step g named} => throws listing the step names that were named', () => {
      expect(() =>
        stepRefResolveTransformer({
          ref: '{zzz.guild.id}',
          outputs: { g: { guild: { id: 'g_1' } } },
        }),
      ).toThrow(
        'Step reference "{zzz.guild.id}" names step "zzz", but no earlier step named its output "zzz" with as:. Steps named so far: g.',
      );
    });
  });

  describe('a reference naming a row that step did not save', () => {
    it('INVALID: {ref "{g.session.id}", step g saved only row guild} => throws listing the rows step g DID save', () => {
      expect(() =>
        stepRefResolveTransformer({
          ref: '{g.session.id}',
          outputs: { g: { guild: { id: 'g_1' } } },
        }),
      ).toThrow(
        'Step reference "{g.session.id}" names row "session" on step "g", but step "g" saved no row by that name. It saved: guild.',
      );
    });
  });

  describe('a reference naming a field the row does not carry', () => {
    it('INVALID: {ref "{g.guild.slug}", row guild carries id/urlSlug} => throws listing the row\'s fields', () => {
      expect(() =>
        stepRefResolveTransformer({
          ref: '{g.guild.slug}',
          outputs: { g: { guild: { id: 'g_1', urlSlug: 'the-guild' } } },
        }),
      ).toThrow(
        'Step reference "{g.guild.slug}" names field "slug" on row "guild" of step "g", but that row carries no field "slug". It carries: id, urlSlug.',
      );
    });
  });
});
